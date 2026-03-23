import logging
from typing import Any

from backend.core.auth import get_db
from backend.core.ledger_chain import GENESIS_HASH, classify_action_type, hash_row

logger = logging.getLogger(__name__)

_CHAIN_COLS = "id, agent_id, action, status, created_at, prev_hash"


def log_gate_execution(
    *,
    agent_id: str,
    intent: str,
    decision: str,
    metadata: dict[str, Any],
    org_id: str,
    tool_name: str | None = None,
) -> dict | None:
    db = get_db()

    # Classify action type from intent or tool_name
    action_type = classify_action_type(intent, tool_name)

    # Compute prev_hash by chaining from the most recent row for this org.
    # If no prior row exists, anchor to the genesis hash.
    prev_resp = (
        db.table("ledger_events")
        .select(_CHAIN_COLS)
        .eq("organization_id", org_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    prev_rows = prev_resp.data or []
    if prev_rows:
        logger.warning(f"CHAIN: prev_row created_at raw = {repr(prev_rows[0]['created_at'])}")
        computed_hash = hash_row(prev_rows[0])
        logger.warning(f"CHAIN: computed prev_hash = {computed_hash}")
        prev_hash = computed_hash
    else:
        prev_hash = GENESIS_HASH

    payload = {
        "organization_id": org_id,
        "agent_id":         agent_id,
        "action":           intent,
        "status":           decision,
        "metadata":         metadata,
        "action_type":      action_type,
        "prev_hash":        prev_hash,
    }

    response = db.table("ledger_events").insert(payload).execute()
    rows = response.data or []

    return rows[0] if rows else None
