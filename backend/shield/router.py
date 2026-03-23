"""
Shield router — GovernHQ

GET  /shield/stats              — blocked agent count, gate stats, anomalies today
GET  /shield/blocked            — all blocked agents for the org with block metadata
POST /shield/agents/{id}/allow  — un-block a single agent (set status → active)
POST /shield/block-all          — block every non-blocked agent in the org

Auth:     Bearer JWT → org_id via core.auth.auth_context
DB:       core.auth.get_db() singleton — service key, org scoping explicit
Response: {"data": ..., "error": null/string, "status": int}

Migration required: 000005_add_agent_blocked_reason.sql
  ALTER TABLE agents ADD COLUMN IF NOT EXISTS blocked_reason text;
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from backend.core.auth import auth_context, get_db

router = APIRouter(prefix="/shield", tags=["shield"])


# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------

def _ok(data: Any, status: int = 200) -> JSONResponse:
    return JSONResponse({"data": data, "error": None, "status": status}, status_code=status)


def _err(message: str, status: int) -> JSONResponse:
    return JSONResponse({"data": None, "error": message, "status": status}, status_code=status)


# ---------------------------------------------------------------------------
# GET /shield/stats
# Aggregated protection metrics for the org:
#   - blocked_agents / active_agents: from agents table
#   - reasoning_evaluated, gate_blocked, gate_paused, avg_gate_ms: from ledger_events
#   - anomalies_today: ledger_events with metadata.anomaly == true, created today
# ---------------------------------------------------------------------------

@router.get("/stats")
def get_shield_stats(ctx: dict = Depends(auth_context)) -> JSONResponse:
    org_id = ctx["organization_id"]
    db = get_db()

    # Agent status counts
    blocked_resp = (
        db.table("agents")
        .select("id", count="exact")
        .eq("organization_id", org_id)
        .eq("status", "blocked")
        .execute()
    )
    blocked_agents = blocked_resp.count or 0

    active_resp = (
        db.table("agents")
        .select("id", count="exact")
        .eq("organization_id", org_id)
        .eq("status", "active")
        .execute()
    )
    active_agents = active_resp.count or 0

    # Ledger aggregates
    ledger_resp = (
        db.table("ledger_events")
        .select("status, metadata, created_at")
        .eq("organization_id", org_id)
        .execute()
    )
    rows = ledger_resp.data or []

    today = datetime.now(timezone.utc).date().isoformat()

    reasoning_evaluated = len(rows)
    gate_blocked = sum(1 for r in rows if r.get("status") == "block")
    gate_paused  = sum(1 for r in rows if r.get("status") == "pause")

    gate_ms_values = [
        r["metadata"]["gate_ms"]
        for r in rows
        if isinstance(r.get("metadata"), dict) and r["metadata"].get("gate_ms") is not None
    ]
    avg_gate_ms = (
        round(sum(gate_ms_values) / len(gate_ms_values), 1)
        if gate_ms_values else None
    )

    anomalies_today = sum(
        1 for r in rows
        if isinstance(r.get("metadata"), dict)
        and r["metadata"].get("anomaly")
        and (r.get("created_at") or "").startswith(today)
    )

    block_latency_values = [
        r["metadata"]["block_latency_ms"]
        for r in rows
        if isinstance(r.get("metadata"), dict)
        and r["metadata"].get("block_latency_ms") is not None
    ]
    avg_block_latency_ms = (
        round(sum(block_latency_values) / len(block_latency_values), 1)
        if block_latency_values else None
    )

    return _ok({
        "blocked_agents":        blocked_agents,
        "active_agents":         active_agents,
        "reasoning_evaluated":   reasoning_evaluated,
        "gate_blocked":          gate_blocked,
        "gate_paused":           gate_paused,
        "avg_gate_ms":           avg_gate_ms,
        "anomalies_today":       anomalies_today,
        "avg_block_latency_ms":  avg_block_latency_ms,
    })


# ---------------------------------------------------------------------------
# GET /shield/blocked
# Returns every agent with status = 'blocked' for the org.
# Enriches with blocked_reason (column), blocked_by + blocked_at (metadata).
#
# Note on test ordering: this endpoint queries WHERE status = 'blocked' which
# includes both manually blocked agents AND monitor-auto-blocked agents
# (blocked_by = 'monitor' in metadata). An agent will NOT appear here if it
# has already been re-allowed (status = 'active') before this endpoint is
# called — ensure the check runs before any allow operation.
# ---------------------------------------------------------------------------

@router.get("/blocked")
def get_blocked_agents(ctx: dict = Depends(auth_context)) -> JSONResponse:
    org_id = ctx["organization_id"]
    db = get_db()

    resp = (
        db.table("agents")
        .select("id, name, status, risk_profile, blocked_reason, metadata, created_at")
        .eq("organization_id", org_id)
        .eq("status", "blocked")
        .order("created_at", desc=True)
        .execute()
    )
    agents = resp.data or []

    enriched = []
    for agent in agents:
        meta = agent.get("metadata") or {}
        enriched.append({
            "id":             agent["id"],
            "name":           agent.get("name", "Unknown"),
            "status":         "blocked",
            "risk_profile":   agent.get("risk_profile"),
            "blocked_reason": agent.get("blocked_reason") or meta.get("blocked_reason") or "Blocked by system",
            "blocked_by":     meta.get("blocked_by", "System"),
            "blocked_at":     meta.get("blocked_at") or agent.get("created_at"),
        })

    return _ok(enriched)


# ---------------------------------------------------------------------------
# POST /shield/agents/{agent_id}/allow
# Un-blocks a single agent: sets status → active, clears blocked_reason,
# removes block metadata keys. Scoped to caller's org.
# ---------------------------------------------------------------------------

@router.post("/agents/{agent_id}/allow")
def allow_agent(agent_id: str, ctx: dict = Depends(auth_context)) -> JSONResponse:
    org_id = ctx["organization_id"]
    db = get_db()

    # Verify ownership and fetch current metadata
    check = (
        db.table("agents")
        .select("id, metadata")
        .eq("id", agent_id)
        .eq("organization_id", org_id)
        .maybe_single()
        .execute()
    )
    if not check.data:
        return _err("Agent not found", 404)

    meta = dict(check.data.get("metadata") or {})
    meta.pop("blocked_by", None)
    meta.pop("blocked_at", None)
    meta.pop("blocked_reason", None)

    result = (
        db.table("agents")
        .update({"status": "active", "blocked_reason": None, "metadata": meta})
        .eq("id", agent_id)
        .eq("organization_id", org_id)
        .execute()
    )
    if not result.data:
        return _err("Failed to allow agent", 500)

    return _ok({"id": agent_id, "status": "active"})


# ---------------------------------------------------------------------------
# POST /shield/block-all
# Blocks every non-blocked agent in the org. Sets blocked_reason + metadata.
# Iterates per agent to preserve existing metadata keys (e.g., last_seen).
# ---------------------------------------------------------------------------

@router.post("/block-all")
def block_all_agents(ctx: dict = Depends(auth_context)) -> JSONResponse:
    org_id = ctx["organization_id"]
    db = get_db()

    now = datetime.now(timezone.utc).isoformat()

    # Fetch all non-blocked agents
    agents_resp = (
        db.table("agents")
        .select("id, metadata")
        .eq("organization_id", org_id)
        .neq("status", "blocked")
        .execute()
    )
    agents = agents_resp.data or []

    if not agents:
        return _ok({"blocked_count": 0, "message": "No active agents to block"})

    blocked_count = 0
    for agent in agents:
        meta = dict(agent.get("metadata") or {})
        meta["blocked_by"] = "admin"
        meta["blocked_at"] = now

        db.table("agents").update({
            "status":         "blocked",
            "blocked_reason": "Emergency: Block All activated",
            "metadata":       meta,
        }).eq("id", agent["id"]).execute()

        blocked_count += 1

    return _ok({"blocked_count": blocked_count, "message": f"{blocked_count} agents blocked"})
