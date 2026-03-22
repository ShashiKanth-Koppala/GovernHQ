"""
Monitoring router — GovernHQ

GET /monitoring/ledger  — paginated Gate decision log for the org
GET /monitoring/metrics — aggregated counts and stats for the org

Auth:     Bearer JWT → org_id resolved via core.auth.auth_context
          (same resolution logic as gate/router.py)
DB:       core.auth.get_db() singleton — service key, org scoping explicit
Response: {"data": ..., "error": null, "status": int}

ledger_events columns queried: id, agent_id, action, status, metadata,
                                created_at, organization_id
"""

from __future__ import annotations

from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from backend.core.auth import auth_context, get_db

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

_LEDGER = "ledger_events"
_LEDGER_COLS = "id, agent_id, action, status, metadata, created_at, organization_id"

# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------

def _ok(data: Any, status: int = 200) -> JSONResponse:
    return JSONResponse({"data": data, "error": None, "status": status}, status_code=status)


def _err(message: str, status: int) -> JSONResponse:
    return JSONResponse({"data": None, "error": message, "status": status}, status_code=status)


# ---------------------------------------------------------------------------
# GET /monitoring/ledger
# Returns paginated ledger_events for the caller's org, newest first.
# Optional filters: status, agent_id. Pagination: limit (max 100) + offset.
# Response includes total count matching all filters (not just the page).
# ---------------------------------------------------------------------------

@router.get("/ledger")
def get_ledger(
    status: Optional[Literal["allow", "pause", "block"]] = Query(default=None),
    agent_id: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    ctx: dict = Depends(auth_context),
) -> JSONResponse:
    org_id = ctx["organization_id"]
    db = get_db()

    query = (
        db.table(_LEDGER)
        .select(_LEDGER_COLS, count="exact")
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
# GET /monitoring/metrics
# Returns aggregated stats for the org's ledger_events.
#
# avg_gate_ms: reads metadata["gate_ms"] per row. Currently null for all
#   rows because no caller writes gate_ms into metadata yet. Will become
#   live once callers (agents/router.py or gate/router.py) add timing and
#   store it under that key before calling log_gate_execution().
#
# NOTE: fetches all rows for the org. Acceptable for MVP; add DB-side
#   aggregation (via Postgres function or SQL endpoint) if row counts grow.
# ---------------------------------------------------------------------------

@router.get("/metrics")
def get_metrics(ctx: dict = Depends(auth_context)) -> JSONResponse:
    org_id = ctx["organization_id"]
    db = get_db()

    result = (
        db.table(_LEDGER)
        .select("status, agent_id, metadata")
        .eq("organization_id", org_id)
        .execute()
    )
    rows = result.data or []

    total   = len(rows)
    allowed = sum(1 for r in rows if r.get("status") == "allow")
    blocked = sum(1 for r in rows if r.get("status") == "block")
    paused  = sum(1 for r in rows if r.get("status") == "pause")

    agents_monitored = len({r["agent_id"] for r in rows if r.get("agent_id")})

    gate_ms_values = [
        r["metadata"]["gate_ms"]
        for r in rows
        if isinstance(r.get("metadata"), dict)
        and r["metadata"].get("gate_ms") is not None
    ]
    avg_gate_ms = (
        round(sum(gate_ms_values) / len(gate_ms_values), 2)
        if gate_ms_values else None
    )

    return _ok({
        "total": total,
        "allowed": allowed,
        "blocked": blocked,
        "paused": paused,
        "agents_monitored": agents_monitored,
        "avg_gate_ms": avg_gate_ms,
    })


# ---------------------------------------------------------------------------
# GET /monitoring/anomalies
# Returns ledger_events rows that carry anomaly detection data in their
# metadata field (written by the anomaly detection layer when active).
# Empty list is normal until detect_anomalies() writes anomaly metadata.
# ---------------------------------------------------------------------------

@router.get("/anomalies")
def get_anomalies(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    ctx: dict = Depends(auth_context),
) -> JSONResponse:
    org_id = ctx["organization_id"]
    db = get_db()

    result = (
        db.table(_LEDGER)
        .select(_LEDGER_COLS)
        .eq("organization_id", org_id)
        .order("created_at", desc=True)
        .execute()
    )
    all_rows = result.data or []

    anomaly_rows = [
        r for r in all_rows
        if isinstance(r.get("metadata"), dict) and r["metadata"].get("anomaly")
    ]

    total = len(anomaly_rows)
    page  = anomaly_rows[offset: offset + limit]

    return _ok({"rows": page, "total": total, "limit": limit, "offset": offset})


# ---------------------------------------------------------------------------
# GET /monitoring/sources
# Returns per-source (n8n / zapier) breakdown of Gate decision counts.
# Joins ledger_events with agents (in Python) to resolve source from agent_id.
# ---------------------------------------------------------------------------

@router.get("/sources")
def get_sources(ctx: dict = Depends(auth_context)) -> JSONResponse:
    org_id = ctx["organization_id"]
    db = get_db()

    agents_resp = (
        db.table("agents")
        .select("id, source")
        .eq("organization_id", org_id)
        .execute()
    )
    source_map: dict[str, str] = {
        a["id"]: a.get("source", "unknown")
        for a in (agents_resp.data or [])
    }

    ledger_resp = (
        db.table(_LEDGER)
        .select("agent_id, status")
        .eq("organization_id", org_id)
        .execute()
    )
    rows = ledger_resp.data or []

    counts: dict[str, dict[str, Any]] = {}
    for row in rows:
        src = source_map.get(row.get("agent_id") or "", "unknown")
        if src not in counts:
            counts[src] = {"source": src, "total": 0, "allow": 0, "pause": 0, "block": 0}
        counts[src]["total"] += 1
        st = row.get("status", "")
        if st in ("allow", "pause", "block"):
            counts[src][st] += 1

    return _ok(list(counts.values()))
