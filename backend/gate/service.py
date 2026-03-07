from .schemas import GateEvaluateRequest, GateEvaluateResponse


BLOCK_KEYWORDS = {
    "transfer funds",
    "wire money",
    "delete database",
    "drop table",
    "exfiltrate data",
}

FLAG_KEYWORDS = {
    "export data",
    "send email",
    "modify policy",
    "change permissions",
}


def evaluate_intent(payload: GateEvaluateRequest, risk_profile: str | None = None) -> GateEvaluateResponse:
    intent_lower = payload.intent.strip().lower()

    matched_block = [kw for kw in BLOCK_KEYWORDS if kw in intent_lower]
    if matched_block:
      
      # Not sure what we should set the risk factors at currently so I have it like this for now.
        return GateEvaluateResponse(
            decision="block",
            risk_score=0.95,
            reason="Intent matched blocked keywords.",
            policy_matches=matched_block,
        )

    matched_flag = [kw for kw in FLAG_KEYWORDS if kw in intent_lower]
    if matched_flag:
        return GateEvaluateResponse(
            decision="flag",
            risk_score=0.70,
            reason="Intent matched review-required keywords.",
            policy_matches=matched_flag,
        )

    if risk_profile == "high":
        return GateEvaluateResponse(
            decision="flag",
            risk_score=0.80,
            reason="High-risk agent actions require review.",
            policy_matches=["high_risk_agent_review"],
        )

    if risk_profile == "medium":
        return GateEvaluateResponse(
            decision="allow",
            risk_score=0.45,
            reason="No blocking policy matched. Medium-risk agent allowed.",
            policy_matches=[],
        )

    return GateEvaluateResponse(
        decision="allow",
        risk_score=0.20,
        reason="No blocking policy matched.",
        policy_matches=[],
    )
