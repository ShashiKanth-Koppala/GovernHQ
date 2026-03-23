from typing import Any, Optional
from datetime import datetime, timedelta
import json

from core.auth import get_db
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

def log_governance_event(
    *,
    agent_id: str,
    org_id: str,
    intent: str,
    decision: str,
    metadata: dict[str, Any],
) -> dict | None:
    """Log to ledger_events table matching exactly the database schema."""
    db = get_db()

    payload = {
        "agent_id": agent_id,
        "organization_id": org_id,
        "action": intent,
        "status": decision,
        "metadata": metadata,
    }

    try:
        response = db.table("ledger_events").insert(payload).execute()
        return response.data[0] if response.data else None
    except:
        return None

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
    
    # 2a. Fetch organization policies - Match schema: is_enabled (bool), rule (json)
    active_policies = (
        db.table("policies")
        .select("name, rule")
        .eq("organization_id", org_id)
        .eq("is_enabled", True)
        .execute()
    )
    
    matches = []
    intent_lower = intent.strip().lower()
    
    # 2b. Check keyword-based core policies (Safety defaults)
    for kw in BLOCK_KEYWORDS:
        if kw in intent_lower:
            matches.append(f"block_policy_match:{kw}")
            
    for kw in FLAG_KEYWORDS:
        if kw in intent_lower:
            matches.append(f"flag_policy_match:{kw}")
            
    # 2c. Check dynamic organization-specific policies from the DB
    if active_policies.data:
        for policy in active_policies.data:
            # Check if intent matches policy name or rules
            rule = policy.get("rule") or {}
            keywords = rule.get("keywords", [])
            
            # Match by name
            if policy["name"].lower() in intent_lower:
                matches.append(f"org_policy_match:{policy['name']}")
                continue
            
            # Match by keyword rule
            for kw in keywords:
                if kw.lower() in intent_lower:
                    matches.append(f"rule_match:{policy['name']}:{kw}")
                    break
                
    return matches

def compute_risk(agent_profile: str, matched_policies: list[str], intent: str) -> float:
    """3. Compute risk score based on agent profiling and policy matches."""
    # Base risk from agent profile
    risk_score = 0.1
    if agent_profile == "medium":
        risk_score = 0.4
    elif agent_profile == "high":
        risk_score = 0.7
        
    # Increment for policy matches
    for match in matched_policies:
        if "block" in match:
            risk_score += 0.4
        elif "flag" in match:
            risk_score += 0.2
            
    # Cap at 1.0
    return min(1.0, risk_score)

def detect_anomalies(agent_id: str, org_id: str) -> list[str]:
    """4. Detect anomalies based on recent agent activity patterns."""
    db = get_db()
    anomalies = []
    
    # Simple rate-limiting anomaly: more than 10 calls in the last minute
    one_minute_ago = (datetime.utcnow() - timedelta(minutes=1)).isoformat()
    
    recent_events = (
        db.table("ledger_events")
        .select("id")
        .eq("agent_id", agent_id)
        .gt("created_at", one_minute_ago)
        .execute()
    )
    
    event_count = len(recent_events.data or [])
    if event_count > 10:
        anomalies.append(f"rate_anomaly: {event_count} actions/min (threshold: 10)")
        
    return anomalies

def process_evaluation(payload: GovernEvaluateRequest, org_id: str) -> GovernEvaluateResponse:
    """5. Orchestrate the evaluation process and return the decision."""
    # 1. Identify Agent
    agent_info = identify_agent(payload.agent_id, org_id)
    
    # 2. Evaluate Policies
    policy_matches = evaluate_policies(payload.intent, payload.tool_name, org_id)
    
    # 4. Detect Anomalies
    anomalies = detect_anomalies(payload.agent_id, org_id)
    
    # 3. Compute Risk
    # Add anomaly weight to risk
    risk_score = compute_risk(agent_info.get("risk_profile", "low"), policy_matches, payload.intent)
    if anomalies:
        risk_score = min(1.0, risk_score + 0.2)
        
    # Determine Decision
    decision = "allow"
    reason = "No issues detected. Intent is within safe boundaries."
    
    if any("block" in m for m in policy_matches) or risk_score >= 0.9:
        decision = "block"
        reason = "Blocked by policy or critically high risk score."
    elif any("flag" in m for m in policy_matches) or anomalies or risk_score >= 0.6:
        decision = "flag"
    # 5. Log decision (Audit log)
    # Match schema: Includes organization_id
    log_governance_event(
        agent_id=payload.agent_id,
        org_id=org_id,
        intent=payload.intent,
        decision=decision,
        metadata={
            **payload.metadata,
            "risk_score": risk_score,
            "anomalies": anomalies,
            "policy_matches": policy_matches,
            "tool_name": payload.tool_name,
            "arguments": payload.arguments
        }
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
