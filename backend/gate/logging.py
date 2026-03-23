import hashlib
import json
from typing import Any
from datetime import datetime, timezone

from core.auth import get_db


def _compute_hash(entry: dict, prev_hash: str | None) -> str:
    payload = {
        "organization_id": entry.get("organization_id"),
        "agent_id": entry.get("agent_id"),
        "action": entry.get("action"),
        "status": entry.get("status"),
        "created_at": entry.get("created_at"),
        "prev_hash": prev_hash or "",
    }
    content = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(content.encode()).hexdigest()


def log_gate_execution(
    *,
    agent_id: str,
    intent: str,
    decision: str,
    metadata: dict[str, Any],
    org_id: str,
) -> dict | None:
    db = get_db()

    # Get the last row's hash to chain from
    last_row = (
        db.table("ledger_events")
        .select("entry_hash")
        .eq("organization_id", org_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    prev_hash = None
    if last_row.data:
        prev_hash = last_row.data[0].get("entry_hash")

    created_at = datetime.now(timezone.utc).isoformat()

    payload = {
        "organization_id": org_id,
        "agent_id": agent_id,
        "action": intent,
        "status": decision,
        "metadata": metadata,
        "created_at": created_at,
        "prev_hash": prev_hash,
    }

    entry_hash = _compute_hash(payload, prev_hash)
    payload["entry_hash"] = entry_hash

    response = db.table("ledger_events").insert(payload).execute()
    rows = response.data or []

    return rows[0] if rows else None