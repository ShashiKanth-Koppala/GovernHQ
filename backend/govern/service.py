from typing import Any, Optional
from datetime import datetime, timedelta

from backend.core.auth import get_db
from backend.gate.logging import log_gate_execution
from .schemas import GovernEvaluateRequest, GovernEvaluateResponse

# Keyword-based policy rules (MVP)
BLOCK_KEYWORDS = {
    "transfer funds", "wire money", "delete database", "drop table", "exfiltrate data",
    "modify billing", "bypass auth", "escalate privilege"
}

FLAG_KEYWORDS = {
    "export data", "send email", "modify policy", "change permissions",
    "access pii", "list users", "bulk delete", "download files"
}


def identify_agent(agent_id: str, org_id: str) -> dict[str, Any]:
    """1. Identify agent across organizations."""
    db = get_db()
    result = (
        db.table("agents")
        .select("id, name, status, risk_profile, organization_id")
        .eq("id", agent_id)
        .eq("organization_id", org_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise ValueError(f"Agent {agent_id} not found or access denied.")
    return result.data


def evaluate_policies(intent: str, tool_name: Optional[str], org_id: str) -> list[str]:
    """2. Evaluate policies based on intent and DB-defined rules."""
    db = get_db()
    active_policies = (
        db.table("policies")
        .select("name, rule")
        .eq("organization_id", org_id)
        .eq("is_enabled", True)
        .execute()
    )

    matches = []
    intent_lower = intent.strip().lower()

    for kw in BLOCK_KEYWORDS:
        if kw in intent_lower:
            matches.append(f"block_policy_match:{kw}")

    for kw in FLAG_KEYWORDS:
        if kw in intent_lower:
            matches.append(f"flag_policy_match:{kw}")

    for policy in (active_policies.data or []):
        rule = policy.get("rule") or {}
        condition = (rule.get("condition") or "").strip().lower()
        action = rule.get("action", "")

        if condition and condition in intent_lower:
            if action == "block":
                matches.append(f"block_policy_match:{policy['name']}")
            elif action == "review":
                matches.append(f"review_policy_match:{policy['name']}")
            else:
                matches.append(f"org_policy_match:{policy['name']}")

    return matches


def compute_risk(agent_profile: str, matched_policies: list[str], intent: str) -> float:
    """3. Compute risk score based on agent profiling and policy matches."""
    risk_score = 0.1
    if agent_profile == "medium":
        risk_score = 0.4
    elif agent_profile == "high":
        risk_score = 0.7

    for match in matched_policies:
        if "block" in match:
            risk_score += 0.4
        elif "flag" in match or "review" in match:
            risk_score += 0.2

    return min(1.0, risk_score)


def detect_anomalies(agent_id: str, org_id: str) -> list[str]:
    """4. Detect anomalies based on recent agent activity patterns."""
    db = get_db()
    anomalies = []

    one_minute_ago = (datetime.utcnow() - timedelta(minutes=1)).isoformat()
    recent_events = (
        db.table("ledger_events")
        .select("id, status, action")
        .eq("agent_id", agent_id)
        .gt("created_at", one_minute_ago)
        .execute()
    )
    rows = recent_events.data or []
    event_count = len(rows)
    if event_count > 10:
        anomalies.append(f"rate_anomaly: {event_count} actions/min (threshold: 10)")

    block_count = sum(1 for r in rows if r.get("status") == "block")
    if block_count >= 3:
        anomalies.append(f"repeated_blocks: {block_count} blocks in last minute")

    from collections import Counter
    intent_counts = Counter(r.get("action", "").strip().lower() for r in rows)
    for intent, count in intent_counts.items():
        if count >= 5 and intent:
            anomalies.append(f"reasoning_loop: intent '{intent[:50]}' repeated {count} times in 1 minute")
            break

    last_20 = (
        db.table("ledger_events")
        .select("status")
        .eq("agent_id", agent_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    last_20_rows = last_20.data or []
    if len(last_20_rows) >= 10:
        block_rate = sum(1 for r in last_20_rows if r.get("status") == "block") / len(last_20_rows)
        if block_rate > 0.5:
            anomalies.append(f"behavioral_drift: block rate {round(block_rate * 100)}% over last {len(last_20_rows)} events")

    return anomalies


def process_evaluation(payload: GovernEvaluateRequest, org_id: str) -> GovernEvaluateResponse:
    """5. Orchestrate the full evaluation pipeline."""
    agent_info = identify_agent(payload.agent_id, org_id)
    policy_matches = evaluate_policies(payload.intent, payload.tool_name, org_id)
    anomalies = detect_anomalies(payload.agent_id, org_id)

    risk_score = compute_risk(agent_info.get("risk_profile", "low"), policy_matches, payload.intent)
    if anomalies:
        risk_score = min(1.0, risk_score + 0.2)

    decision = "allow"
    reason = "No issues detected. Intent is within safe boundaries."

    if any("block" in m for m in policy_matches) or risk_score >= 0.9:
        decision = "block"
        reason = "Blocked by policy or critically high risk score."
    elif any("review" in m or "flag" in m for m in policy_matches) or anomalies or risk_score >= 0.6:
        decision = "pause"
        reason = "Intent flagged for review due to anomaly or elevated risk."

    if anomalies:
        db = get_db()
        # Should stop the issue Sami was having
        #db.table("agents").update({"status": "blocked"}).eq("id", payload.agent_id).execute()
        decision = "block"
        reason = f"Agent auto-blocked by monitor: {anomalies[0]}"

    log_gate_execution(
        agent_id=payload.agent_id,
        intent=payload.intent,
        decision=decision,
        metadata={
            **payload.metadata,
            "risk_score": risk_score,
            "anomalies": anomalies,
            "anomaly": len(anomalies) > 0,
            "policy_matches": policy_matches,
            "tool_name": payload.tool_name,
            "arguments": payload.arguments,
        },
        org_id=org_id,
    )

    return GovernEvaluateResponse(
        decision=decision,
        risk_score=risk_score,
        reason=reason,
        anomalies=anomalies,
        policy_matches=policy_matches,
        agent_info={
            "id": agent_info["id"],
            "name": agent_info.get("name"),
            "risk_profile": agent_info.get("risk_profile")
        }
    )
