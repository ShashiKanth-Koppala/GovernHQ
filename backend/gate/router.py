from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from backend.core.auth import auth_context, get_db
from backend.core.ratelimit import check_rate_limit
from .logging import log_gate_execution
from .schemas import GateEvaluateRequest
from .service import evaluate_intent

router = APIRouter(prefix="/gate", tags=["gate"])


@router.post("/evaluate")
async def evaluate_gate(
    payload: GateEvaluateRequest,
    ctx: dict = Depends(auth_context),
):
    org_id = ctx["organization_id"]

    if not check_rate_limit(org_id):
        return JSONResponse(
            {"data": None, "error": "Rate limit exceeded: max 100 Gate calls per minute", "status": 429},
            status_code=429,
        )

    result = evaluate_intent(payload, org_id=org_id)

    # Fetch agent display info for the response (best-effort; never fails the request)
    agent_info: dict = {}
    try:
        db = get_db()
        agent_resp = db.table("agents").select("name, status, risk_profile").eq("id", payload.agent_id).limit(1).execute()
        if agent_resp.data:
            agent_info = agent_resp.data[0]
    except Exception:
        pass

    result.agent_info = agent_info

    log_row = log_gate_execution(
        agent_id=payload.agent_id,
        intent=payload.intent,
        decision=result.decision,
        metadata=payload.metadata,
        org_id=org_id,
    )

    return {
        "data": {
            **result.model_dump(),
            "organization_id": org_id,
            "user_id": ctx["user_id"],
            "log_id": log_row["id"] if log_row else None,
        },
        "error": None,
        "status": 200,
    }
