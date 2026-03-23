"""
Audit router — GovernHQ

Exposes read-only endpoints for querying the ledger_events audit trail.
All writes are handled by gate/logging.py (log_gate_execution).

Endpoints:
  GET /audit/events          — paginated, filterable audit log
  GET /audit/events/{id}     — single event by ID
  GET /audit/summary         — aggregate counts by decision + agent

Auth:     Bearer JWT → org_id resolved via core.auth.auth_context
Response: {"data": ..., "error": null/string, "status": int}
"""

from __future__ import annotations

from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from core.auth import auth_context, get_db

router = APIRouter(prefix="/audit", tags=["audit"])

_TABLE = "ledger_events"
_COLS = "id, agent_id, action, status, metadata, created_at, organization_id"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ok(data, status: int = 200) -> JSONResponse:
    return JSONResponse({"data": data, "error": None, "status": status}, status_code=status)


def _err(message: str, status: int) -> JSONResponse:
    return JSONResponse({"data": None, "error": message, "status": status}, status_code=status)


# ---------------------------------------------------------------------------
# GET /audit/events
# Returns a paginated list of ledger_events for the caller's org.
#
# Query params:
#   status   — filter by decision: "allow" | "pause" | "block"
#   agent_id — filter by a specific agent UUID
#   limit    — page size (1–100, default 20)
#   offset   — pagination offset (default 0)
# ---------------------------------------------------------------------------

@router.get("/events")
def list_events(
    status: Optional[Literal["allow", "pause", "block"]] = Query(default=None),
    agent_id: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    ctx: dict = Depends(auth_context),
) -> JSONResponse:
    org_id = ctx["organization_id"]
    db = get_db()

    query = (
        db.table(_TABLE)
        .select(_COLS, count="exact")
        .eq("organization_id", org_id)
    )

    if status is not None:
        query = query.eq("status", status)

    if agent_id is not None:
        query = query.eq("agent_id", agent_id)

    result = (
        query
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return _ok({
        "rows": result.data or [],
        "total": result.count or 0,
        "limit": limit,
        "offset": offset,
    })


# ---------------------------------------------------------------------------
# GET /audit/events/{event_id}
# Returns a single ledger_events row by ID, scoped to caller's org.
# ---------------------------------------------------------------------------

@router.get("/events/{event_id}")
def get_event(
    event_id: str,
    ctx: dict = Depends(auth_context),
) -> JSONResponse:
    org_id = ctx["organization_id"]
    db = get_db()

    result = (
        db.table(_TABLE)
        .select(_COLS)
        .eq("id", event_id)
        .eq("organization_id", org_id)
        .maybe_single()
        .execute()
    )

    if not result.data:
        return _err("Event not found", 404)

    return _ok(result.data)


# ---------------------------------------------------------------------------
# GET /audit/summary
# Returns aggregate counts grouped by status and agent_id.
# Useful for dashboard widgets showing decision breakdown per agent.
# ---------------------------------------------------------------------------

@router.get("/summary")
def get_summary(ctx: dict = Depends(auth_context)) -> JSONResponse:
    org_id = ctx["organization_id"]
    db = get_db()

    result = (
        db.table(_TABLE)
        .select("agent_id, status")
        .eq("organization_id", org_id)
        .execute()
    )
    rows = result.data or []

    # TODO: move this aggregation to a Postgres function once row counts grow
    from collections import defaultdict
    summary: dict[str, dict] = defaultdict(lambda: {"allow": 0, "pause": 0, "block": 0, "total": 0})

    for row in rows:
        agent = row.get("agent_id") or "unknown"
        decision = row.get("status") or "allow"
        summary[agent][decision] = summary[agent].get(decision, 0) + 1
        summary[agent]["total"] += 1

    return _ok([
        {"agent_id": agent_id, **counts}
        for agent_id, counts in summary.items()
    ])

# ---------------------------------------------------------------------------
# GET /audit/verify
# Walks every ledger_events row for the org in chronological order and
# recomputes each entry_hash to confirm the chain is unbroken.
# Returns: { valid: bool, total: int, broken_at: row_id | null }
# ---------------------------------------------------------------------------

@router.get("/verify")
def verify_chain(ctx: dict = Depends(auth_context)) -> JSONResponse:
    org_id = ctx["organization_id"]
    db = get_db()

    result = (
        db.table("ledger_events")
        .select("id, agent_id, action, status, created_at, organization_id, entry_hash, prev_hash")
        .eq("organization_id", org_id)
        .order("created_at", desc=False)
        .execute()
    )
    rows = result.data or []

    # Filter only rows that have been hash-chained
    chained_rows = [r for r in rows if r.get("entry_hash")]

    if not chained_rows:
        return _ok({"valid": True, "total": 0, "broken_at": None, "message": "No chained rows yet."})

    import hashlib, json

    def recompute_hash(row: dict, prev_hash) -> str:
        payload = {
            "organization_id": row.get("organization_id"),
            "agent_id": row.get("agent_id"),
            "action": row.get("action"),
            "status": row.get("status"),
            "created_at": row.get("created_at"),
            "prev_hash": prev_hash or "",
        }
        content = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()

    prev_hash = None
    for row in chained_rows:
        expected = recompute_hash(row, prev_hash)
        if expected != row.get("entry_hash"):
            return _ok({
                "valid": False,
                "total": len(chained_rows),
                "broken_at": row.get("id"),
                "message": f"Chain broken at row {row.get('id')}"
            })
        prev_hash = row.get("entry_hash")

    return _ok({
        "valid": True,
        "total": len(chained_rows),
        "broken_at": None,
        "message": f"Chain intact. {len(chained_rows)} rows verified."
    })

# ---------------------------------------------------------------------------
# POST /audit/review/{event_id}
# Human reviews a paused action — allow or block it.
# Logs a new ledger entry with the human's decision.
# ---------------------------------------------------------------------------

class ReviewAction(BaseModel):
    action: str  # "allow" or "block"
    reason: str = "Human review decision"


@router.post("/review/{event_id}")
def review_event(
    event_id: str,
    body: ReviewAction,
    ctx: dict = Depends(auth_context),
) -> JSONResponse:
    org_id = ctx["organization_id"]
    db = get_db()

    # Fetch the original paused event
    result = (
        db.table(_TABLE)
        .select(_COLS)
        .eq("id", event_id)
        .eq("organization_id", org_id)
        .eq("status", "pause")
        .maybe_single()
        .execute()
    )

    if not result.data:
        return _err("Paused event not found", 404)

    original = result.data

    if body.action not in ("allow", "block"):
        return _err("action must be 'allow' or 'block'", 400)

    # Log the human decision as a new ledger entry
    from gate.logging import log_gate_execution
    log_gate_execution(
        agent_id=original["agent_id"],
        intent=original["action"],
        decision=body.action,
        metadata={
            **(original.get("metadata") or {}),
            "reviewed_by": ctx["user_id"],
            "review_reason": body.reason,
            "original_event_id": event_id,
            "human_review": True,
        },
        org_id=org_id,
    )

    return _ok({
        "event_id": event_id,
        "action": body.action,
        "message": f"Action {body.action}ed by human reviewer."
    })