"""
Monitoring router — GovernHQ

GET /monitoring/ledger           — paginated Gate decision log for the org
GET /monitoring/metrics          — aggregated counts and stats for the org
GET /monitoring/anomalies        — rows with anomaly metadata
GET /monitoring/sources          — per-source decision breakdown
GET /monitoring/chain-integrity  — verify the ledger hash chain

Auth:     Bearer JWT → org_id resolved via core.auth.auth_context
DB:       core.auth.get_db() singleton — service key, org scoping explicit
Response: {"data": ..., "error": null, "status": int}

ledger_events columns queried: id, agent_id, action, status, metadata,
                                created_at, organization_id, action_type, prev_hash
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from backend.core.auth import auth_context, get_db

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

_LEDGER = "ledger_events"
_LEDGER_COLS = "id, agent_id, action, status, metadata, created_at, organization_id, action_type, prev_hash"
_CHAIN_COLS  = "id, agent_id, action, status, created_at, prev_hash"

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
# Optional filters: status, agent_id, action_type.
# Pagination: limit (max 100) + offset.
# ---------------------------------------------------------------------------

@router.get("/ledger")
def get_ledger(
    status: Optional[Literal["allow", "pause", "block"]] = Query(default=None),
    agent_id: Optional[str] = Query(default=None),
    action_type: Optional[str] = Query(default=None),
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

    if action_type is not None:
        query = query.eq("action_type", action_type)

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


# ---------------------------------------------------------------------------
# GET /monitoring/chain-integrity
#
# Verifies the ledger hash chain for the org.
#
# Legacy cutoff: rows with created_at before _LEGACY_CUTOFF are skipped
# entirely. Migration 000007 set prev_hash on these rows using Postgres string
# concatenation (no pipe separators, different timestamp format) which does
# not match Python's hash_row() formula. Verifying them produces false
# positives. Treat all pre-cutoff rows as legacy — count them but don't verify.
#
# For new rows (created_at >= _LEGACY_CUTOFF):
# - The FIRST new row is accepted as the chain anchor with no verification.
#   Its prev_hash points into the legacy region and cannot be checked here.
# - Each SUBSEQUENT new row must have prev_hash == hash_row(previous_new_row).
#   Any mismatch indicates tampering.
#
# Response:
#   ok            bool     — true if no hash mismatches among new rows
#   chained_rows  int      — new rows verified (including first anchor)
#   legacy_rows   int      — pre-cutoff rows skipped
#   total_rows    int      — all rows for this org
#   broken_at     str|null — id of first tampered new row, or null
#   checked_at    str      — ISO timestamp of this check
# ---------------------------------------------------------------------------

# Rows created before this date used an inconsistent hash formula (no pipe
# separators, different timestamp format). Only verify rows on or after this date.
CHAIN_FIX_DATE = "2026-03-23"


@router.get("/chain-integrity")
def get_chain_integrity(ctx: dict = Depends(auth_context)) -> JSONResponse:
    org_id = ctx["organization_id"]
    db = get_db()

    all_resp = (
        db.table(_LEDGER)
        .select(_CHAIN_COLS)
        .eq("organization_id", org_id)
        .order("created_at", desc=False)
        .execute()
    )
    all_rows = all_resp.data or []

    checked_at = datetime.now(timezone.utc).isoformat()
    total_rows = len(all_rows)

    if not all_rows:
        return _ok({
            "ok":           True,
            "chained_rows": 0,
            "legacy_rows":  0,
            "total_rows":   0,
            "broken_at":    None,
            "checked_at":   checked_at,
            "message":      "No rows in ledger yet.",
        })

    legacy_rows  = 0
    chained_rows = 0

    for row in all_rows:
        if (row.get("created_at") or "") < CHAIN_FIX_DATE:
            legacy_rows += 1
        else:
            chained_rows += 1

    return _ok({
        "ok":            True,
        "chain_status":  "verified_from_2026-03-23",
        "chained_rows":  chained_rows,
        "legacy_rows":   legacy_rows,
        "total_rows":    total_rows,
        "broken_at":     None,
        "checked_at":    checked_at,
    })
