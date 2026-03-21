from fastapi import APIRouter, Depends, HTTPException
from core.auth import auth_context, get_db
from .schemas import GovernEvaluateRequest, GovernEvaluateResponse
from .service import process_evaluation
from gate.logging import log_gate_execution

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
