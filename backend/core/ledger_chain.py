"""
Ledger hash chain helpers — shared between gate/logging.py and monitoring/router.py.

Chain design:
  - GENESIS_HASH  = SHA-256("genesis")  — anchor for the first chained row
  - hash_row(row) = SHA-256(id|agent_id|action|status|created_at|prev_hash)
                    — deterministic fingerprint of a ledger row

On insert (gate/logging.py):
  1. Fetch most recent row for this org.
  2. prev_hash_for_new_row = hash_row(most_recent) if exists else GENESIS_HASH
  3. Insert with prev_hash = prev_hash_for_new_row.

On verify (monitoring/router.py → GET /monitoring/chain-integrity):
  1. Fetch all chained rows (prev_hash IS NOT NULL) in ascending created_at order.
  2. For row[0]: expected prev_hash == GENESIS_HASH
  3. For row[i]: expected prev_hash == hash_row(row[i-1])
  4. Any mismatch → chain broken.

Concurrent-insert caveat:
  Two simultaneous inserts may both read the same "last row" and produce the
  same prev_hash, creating a fork. Acceptable for MVP; production would use
  a serializable DB transaction or a Postgres trigger.
"""

from __future__ import annotations

import hashlib

GENESIS_HASH: str = hashlib.sha256(b"genesis").hexdigest()


def hash_row(row: dict) -> str:
    """Return the SHA-256 fingerprint of a ledger_events row.

    The input is a pipe-delimited concatenation of the row's immutable fields.
    ``prev_hash`` is included so that each hash cryptographically incorporates
    the full prior history.
    """
    created_at = row.get("created_at") or ""
    if hasattr(created_at, "isoformat"):
        created_at = created_at.isoformat()
    created_at = str(created_at).replace("T", " ").replace("+00:00", "+00")

    raw = (
        str(row.get("id",        "")) +
        str(row.get("agent_id",  "")) +
        str(row.get("action",    "")) +
        str(row.get("status",    "")) +
        created_at +
        str(row.get("prev_hash") or "")
    )
    return hashlib.sha256(raw.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Action-type classifier
# ---------------------------------------------------------------------------

_DB_QUERY_KEYWORDS    = ("query", "select", "fetch", "retrieve", "read", "get", "find", "search", "lookup")
_DB_WRITE_KEYWORDS    = ("write", "insert", "update", "delete", "mutate", "create", "put", "patch", "upsert")
_API_CALL_KEYWORDS    = ("api call", "api_call", "http", "request", "webhook", "endpoint", "rest", "graphql")
_FILE_IO_KEYWORDS     = ("file", "upload", "download", "read file", "write file", "blob", "s3")
_NOTIFICATION_KEYWORDS = ("email", "sms", "message", "send", "notify", "notification", "slack", "alert", "broadcast")


def classify_action_type(intent: str, tool_name: str | None = None) -> str:
    """Return an action-type label for a Gate event.

    Checks ``tool_name`` first (more precise), then falls back to keyword
    scanning of the ``intent`` string.  Returns one of:
        DB_QUERY | DB_WRITE | API_CALL | FILE_IO | NOTIFICATION | AGENT_ACTION
    """
    probe = (tool_name or "").lower()
    if not probe:
        probe = intent.lower()

    if any(k in probe for k in _DB_QUERY_KEYWORDS):
        return "DB_QUERY"
    if any(k in probe for k in _DB_WRITE_KEYWORDS):
        return "DB_WRITE"
    if any(k in probe for k in _API_CALL_KEYWORDS):
        return "API_CALL"
    if any(k in probe for k in _FILE_IO_KEYWORDS):
        return "FILE_IO"
    if any(k in probe for k in _NOTIFICATION_KEYWORDS):
        return "NOTIFICATION"

    # If tool_name didn't produce a match, also try the intent
    if tool_name:
        return classify_action_type(intent, tool_name=None)

    return "AGENT_ACTION"
