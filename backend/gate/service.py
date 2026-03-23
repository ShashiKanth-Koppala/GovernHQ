import sys

from backend.core.auth import get_db
from .schemas import GateEvaluateRequest, GateEvaluateResponse

# Actual policies table schema (confirmed from Supabase on 2026-03-17):
#   organization_id  uuid     — org scoping
#   is_enabled       boolean  — True = active; filter to is_enabled=true
#   name             text     — returned in policy_matches
#   rule             jsonb    — policy rule payload; assumed shape:
#                              {"action": "block"|"review"|"log",
#                               "condition": "<intent substring to match>"}
#
# The `action` and `condition` values are stored inside the rule jsonb field,
# not as top-level columns. This is inferred from the schema — no migration
# for the policies table exists in this repo to document the rule payload shape.
#
# Matching: a policy fires when rule.condition is a non-empty case-insensitive
# substring of the incoming intent string.
# Priority: block > review (→ pause) > log > none (→ allow).


# ---------------------------------------------------------------------------
# Scope enforcement helpers
# ---------------------------------------------------------------------------

# Intent keyword → planned action type mapping.
# First match wins (order matters — more specific sets come first).
_SCOPE_ACTION_KEYWORDS: dict[str, set[str]] = {
    "DB_WRITE":     {"delete", "drop", "truncate", "update", "insert", "write", "remove"},
    "NOTIFICATION": {"send", "email", "notify", "message", "sms", "alert", "post"},
    "FILE_IO":      {"export", "download", "extract", "dump", "backup", "output"},
    "API_CALL":     {"api", "call", "request", "fetch", "webhook", "http"},
}


def _classify_intent(intent_lower: str) -> str:
    """Map an intent string to a planned action type for scope checking."""
    for action_type, keywords in _SCOPE_ACTION_KEYWORDS.items():
        if any(kw in intent_lower for kw in keywords):
            return action_type
    return "DB_QUERY"


def _check_scope(scope: dict, intent_lower: str) -> tuple[str | None, str | None]:
    """
    Check whether the intent violates the agent's scope definition.

    Returns (decision, reason):
      - ("block", reason)  — hard scope violation
      - ("pause", reason)  — soft scope violation (requires review)
      - (None, None)       — no violation

    Empty scope dict ({}) = unrestricted — always returns (None, None).

    Rules:
      DB_WRITE   + no databases defined     → block
      NOTIFICATION + external_calls=false   → block
      FILE_IO    + pii_level="none"          → pause (review required)
    """
    if not scope:
        return None, None  # {} is falsy — unrestricted agent, skip all checks

    action_type = _classify_intent(intent_lower)

    if action_type == "DB_WRITE":
        databases = scope.get("databases") or []
        if not databases:
            return "block", "Out of scope: write operations not permitted (no databases in scope)"

    if action_type == "NOTIFICATION":
        if scope.get("external_calls") is False:
            return "block", "Out of scope: external notifications not permitted"

    if action_type == "FILE_IO":
        if (scope.get("pii_level") or "none") == "none":
            return "pause", "Out of scope: file exports require PII clearance — review required"

    return None, None


# ---------------------------------------------------------------------------
# Main evaluation function
# ---------------------------------------------------------------------------

def evaluate_intent(
    payload: GateEvaluateRequest,
    org_id: str | None = None,
    risk_profile: str | None = None,
) -> GateEvaluateResponse:
    """
    Evaluate an agent's intent through the Gate pipeline:

      1. Policy BLOCK   → block  (highest priority, returns immediately)
      2. Scope BLOCK    → block  (out-of-scope hard violation)
      3. Policy PAUSE   → pause
      4. Scope PAUSE    → pause  (out-of-scope soft violation)
      5. Policy LOG     → allow  (logged only)
      6. No match       → allow

    Decision mapping:
      block  policy/scope → "block"
      review policy/scope → "pause"
      log-only or no match → "allow"
    """
    intent_lower = payload.intent.strip().lower()

    if org_id:
        try:
            db = get_db()
            resp = (
                db.table("policies")
                .select("name, rule")
                .eq("organization_id", org_id)
                .eq("is_enabled", True)
                .execute()
            )
            policies = resp.data or []

            def _matches(policy: dict) -> bool:
                rule = policy.get("rule") or {}
                condition = (rule.get("condition") or "").strip().lower()
                return bool(condition) and condition in intent_lower

            def _action(policy: dict) -> str:
                return (policy.get("rule") or {}).get("action", "")

            # Step 1 — Policy BLOCK (highest priority — skip scope check)
            blocked = [p["name"] for p in policies if _action(p) == "block" and _matches(p)]
            if blocked:
                return GateEvaluateResponse(
                    decision="block",
                    risk_score=0.95,
                    reason="Intent matched a blocking policy.",
                    policy_matches=blocked,
                )

            # Step 2 — Scope enforcement (fetch agent scope, check for violations)
            scope: dict = {}
            if payload.agent_id:
                try:
                    scope_resp = (
                        db.table("agents")
                        .select("scope")
                        .eq("id", payload.agent_id)
                        .eq("organization_id", org_id)
                        .maybe_single()
                        .execute()
                    )
                    scope = (scope_resp.data or {}).get("scope") or {}
                except Exception:
                    scope = {}  # Scope fetch failure → fail open (unrestricted)

            scope_decision, scope_reason = _check_scope(scope, intent_lower)

            if scope_decision == "block":
                return GateEvaluateResponse(
                    decision="block",
                    risk_score=0.90,
                    reason=scope_reason,
                    policy_matches=[],
                )

            # Step 3 — Policy PAUSE
            paused = [p["name"] for p in policies if _action(p) == "review" and _matches(p)]
            if paused:
                return GateEvaluateResponse(
                    decision="pause",
                    risk_score=0.70,
                    reason="Intent matched a review-required policy.",
                    policy_matches=paused,
                )

            # Step 4 — Scope PAUSE (only reached if no policy pause)
            if scope_decision == "pause":
                return GateEvaluateResponse(
                    decision="pause",
                    risk_score=0.55,
                    reason=scope_reason,
                    policy_matches=[],
                )

            # Step 5 — Policy LOG
            logged = [p["name"] for p in policies if _action(p) == "log" and _matches(p)]
            if logged:
                return GateEvaluateResponse(
                    decision="allow",
                    risk_score=0.20,
                    reason="Intent logged by policy.",
                    policy_matches=logged,
                )

        except Exception as exc:
            # DB failure — resolve fail_mode from organizations.metadata, default "closed"
            print(f"[gate] DB failure in evaluate_intent: {exc}", file=sys.stderr)
            fail_mode = "closed"
            try:
                fallback_db = get_db()
                org_resp = (
                    fallback_db.table("organizations")
                    .select("metadata")
                    .eq("id", org_id)
                    .maybe_single()
                    .execute()
                )
                fail_mode = ((org_resp.data or {}).get("metadata") or {}).get("fail_mode", "closed")
            except Exception:
                pass  # already defaulted to "closed"

            if fail_mode == "open":
                return GateEvaluateResponse(
                    decision="allow",
                    risk_score=0.20,
                    reason="Gate fallback: DB unavailable — fail open.",
                    policy_matches=[],
                )
            return GateEvaluateResponse(
                decision="block",
                risk_score=0.95,
                reason="Gate fallback: DB unavailable — fail closed.",
                policy_matches=[],
            )

    # Step 6 — Allow
    return GateEvaluateResponse(
        decision="allow",
        risk_score=0.20,
        reason="No blocking policy matched.",
        policy_matches=[],
    )
