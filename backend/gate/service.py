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


def evaluate_intent(
    payload: GateEvaluateRequest,
    org_id: str | None = None,
    risk_profile: str | None = None,
) -> GateEvaluateResponse:
    """
    Evaluate an agent's intent against enabled org policies from Supabase.

    Decision mapping:
      block  policy matches → "block"
      review policy matches → "pause"
      log-only or no match → "allow"
    """
    intent_lower = payload.intent.strip().lower()

    if org_id:
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

        blocked = [p["name"] for p in policies if _action(p) == "block" and _matches(p)]
        if blocked:
            return GateEvaluateResponse(
                decision="block",
                risk_score=0.95,
                reason="Intent matched a blocking policy.",
                policy_matches=blocked,
            )

        paused = [p["name"] for p in policies if _action(p) == "review" and _matches(p)]
        if paused:
            return GateEvaluateResponse(
                decision="pause",
                risk_score=0.70,
                reason="Intent matched a review-required policy.",
                policy_matches=paused,
            )

        logged = [p["name"] for p in policies if _action(p) == "log" and _matches(p)]
        if logged:
            return GateEvaluateResponse(
                decision="allow",
                risk_score=0.20,
                reason="Intent logged by policy.",
                policy_matches=logged,
            )

    return GateEvaluateResponse(
        decision="allow",
        risk_score=0.20,
        reason="No blocking policy matched.",
        policy_matches=[],
    )
