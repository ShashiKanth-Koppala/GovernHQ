from fastapi import APIRouter, Depends, HTTPException
from core.auth import auth_context, get_db
from .schemas import GovernEvaluateRequest, GovernEvaluateResponse
from .service import process_evaluation
from gate.logging import log_gate_execution
from fastapi import APIRouter, Body, Depends, HTTPException

router = APIRouter(prefix="/govern", tags=["govern"])

@router.post("/evaluate")
def evaluate_govern(
    payload: GovernEvaluateRequest,
    ctx: dict = Depends(auth_context),
):
    try:
        # Step 1: Identify, 2: Policies, 3: Risk, 4: Anomalies, 5: Decision
        result = process_evaluation(payload, ctx["organization_id"])
        
        # Log to ledger_events
        log_gate_execution(
            agent_id=payload.agent_id,
            intent=payload.intent,
            decision=result.decision,
            metadata={
                **payload.metadata,
                "risk_score": result.risk_score,
                "anomalies": result.anomalies,
                "policy_matches": result.policy_matches,
                "tool_name": payload.tool_name,
                "arguments": payload.arguments
            }
        )
        
        return {
            "data": result.model_dump(),
            "error": None,
            "status": 200,
        }
    except ValueError as e:
        return {
            "data": None,
            "error": str(e),
            "status": 404,
        }
    except Exception as e:
        return {
            "data": None,
            "error": f"Evaluation error: {str(e)}",
            "status": 500,
        }

@router.get("/policies")
def list_policies(ctx: dict = Depends(auth_context)):
    db = get_db()
    org_id = ctx["organization_id"]
    result = (
        db.table("policies")
        .select("*")
        .eq("organization_id", org_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"data": result.data or [], "error": None, "status": 200}


@router.patch("/policies/{policy_id}")
def update_policy(policy_id: str, ctx: dict = Depends(auth_context)):
    from fastapi import Body
    db = get_db()
    org_id = ctx["organization_id"]
    result = (
        db.table("policies")
        .update({"is_enabled": True})
        .eq("id", policy_id)
        .eq("organization_id", org_id)
        .execute()
    )
    if not result.data:
        return {"data": None, "error": "Policy not found", "status": 404}
    return {"data": result.data[0], "error": None, "status": 200}

@router.post("/policies")
def create_policy(body: dict = Body(...), ctx: dict = Depends(auth_context)):
    db = get_db()
    org_id = ctx["organization_id"]

    name = body.get("name", "").strip()
    condition = body.get("condition", "").strip()
    action = body.get("action", "block").strip()

    if not name or not condition:
        return {"data": None, "error": "name and condition are required", "status": 400}

    if action not in ("block", "review", "log"):
        return {"data": None, "error": "action must be block, review, or log", "status": 400}

    result = (
        db.table("policies")
        .insert({
            "organization_id": org_id,
            "name": name,
            "description": body.get("description", ""),
            "rule": {"action": action, "condition": condition},
            "is_enabled": True,
        })
        .execute()
    )

    if not result.data:
        return {"data": None, "error": "Failed to create policy", "status": 500}

    return {"data": result.data[0], "error": None, "status": 201}


@router.delete("/policies/{policy_id}")
def delete_policy(policy_id: str, ctx: dict = Depends(auth_context)):
    db = get_db()
    org_id = ctx["organization_id"]
    result = (
        db.table("policies")
        .delete()
        .eq("id", policy_id)
        .eq("organization_id", org_id)
        .execute()
    )
    if not result.data:
        return {"data": None, "error": "Policy not found", "status": 404}
    return {"data": result.data[0], "error": None, "status": 200}