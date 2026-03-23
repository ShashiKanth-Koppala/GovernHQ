"""
Anomaly detection — GovernHQ Monitor layer

detect_anomalies(agent_id, org_id, db) checks 3 behavioral rules against
recent ledger_events, then auto-blocks the agent if any rule fires.

Rules (from Decision_Govern.md):
  Rule 1 — High frequency:   >10 gate calls in the last 60 seconds
  Rule 2 — Repeated blocks:  >3 blocked decisions in the last 5 minutes
  Rule 3 — Risk spike:       most recent ledger event has metadata.risk_score > 0.95

Return value:
  {
    "anomaly":        bool,        # True if any rule triggered
    "anomaly_score":  0.0 | 1.0,
    "anomaly_reason": str | None,  # Human-readable rule that fired, or None
  }

Side effects when anomaly detected and agent is not already blocked:
  - agents.status        → 'blocked'
  - agents.blocked_reason → <reason string>
  - agents.metadata      → merged with blocked_by='monitor', blocked_at=<iso>, blocked_reason=<reason>

This is the Monitor layer — it governs agent identity, not individual actions.
The Gate governs individual actions. Both layers are independent.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from supabase import Client


def detect_anomalies(
    agent_id: str,
    org_id: str,
    db: Client,
) -> dict[str, Any]:
    """
    Evaluate behavioral rules for the agent against recent ledger history.
    Auto-blocks the agent (and returns anomaly=True) if any rule fires.
    Returns a clean result dict with no raised exceptions.
    """
    try:
        return _check_rules(agent_id, org_id, db)
    except Exception:
        # Anomaly detection must never crash the Gate request
        return {"anomaly": False, "anomaly_score": 0.0, "anomaly_reason": None}


def _check_rules(agent_id: str, org_id: str, db: Client) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    window_60s  = (now - timedelta(seconds=60)).isoformat()
    window_5min = (now - timedelta(minutes=5)).isoformat()

    # Single query — last 5 minutes covers all three rules
    resp = (
        db.table("ledger_events")
        .select("status, metadata, created_at")
        .eq("agent_id", agent_id)
        .eq("organization_id", org_id)
        .gte("created_at", window_5min)
        .order("created_at", desc=True)
        .execute()
    )
    recent = resp.data or []

    # Rule 1 — High frequency: >10 calls in last 60 seconds
    calls_60s = sum(1 for r in recent if (r.get("created_at") or "") >= window_60s)
    if calls_60s > 10:
        reason = f"High frequency: {calls_60s} calls in the last 60 seconds"
        _auto_block(agent_id, org_id, reason, db)
        return {"anomaly": True, "anomaly_score": 1.0, "anomaly_reason": reason}

    # Rule 2 — Repeated blocks: >3 blocked decisions in last 5 minutes
    blocks_5min = sum(1 for r in recent if r.get("status") == "block")
    if blocks_5min > 3:
        reason = f"Repeated blocks: {blocks_5min} blocked actions in the last 5 minutes"
        _auto_block(agent_id, org_id, reason, db)
        return {"anomaly": True, "anomaly_score": 1.0, "anomaly_reason": reason}

    # Rule 3 — Risk spike: most recent event has risk_score > 0.95 in metadata
    if recent:
        last_meta = recent[0].get("metadata") or {}
        last_risk = last_meta.get("risk_score")
        if isinstance(last_risk, (int, float)) and last_risk > 0.95:
            reason = f"Risk spike: previous action scored {last_risk:.2f}"
            _auto_block(agent_id, org_id, reason, db)
            return {"anomaly": True, "anomaly_score": 1.0, "anomaly_reason": reason}

    return {"anomaly": False, "anomaly_score": 0.0, "anomaly_reason": None}


def _auto_block(agent_id: str, org_id: str, reason: str, db: Client) -> None:
    """
    Set agent status to 'blocked' with a reason. No-op if already blocked.
    Merges block metadata into the existing metadata jsonb to preserve
    other keys (e.g., last_seen).
    """
    check = (
        db.table("agents")
        .select("id, status, metadata")
        .eq("id", agent_id)
        .eq("organization_id", org_id)
        .maybe_single()
        .execute()
    )
    if not check.data or check.data.get("status") == "blocked":
        return  # Already blocked or agent not found — nothing to do

    meta = dict(check.data.get("metadata") or {})
    meta["blocked_by"]     = "monitor"
    meta["blocked_at"]     = datetime.now(timezone.utc).isoformat()
    meta["blocked_reason"] = reason

    db.table("agents").update({
        "status":         "blocked",
        "blocked_reason": reason,
        "metadata":       meta,
    }).eq("id", agent_id).eq("organization_id", org_id).execute()
