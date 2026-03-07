from fastapi import APIRouter

from .schemas import GateEvaluateRequest
from .service import evaluate_intent

router = APIRouter(prefix="/gate", tags=["gate"])


@router.post("/evaluate")
async def evaluate_gate(payload: GateEvaluateRequest):
    result = evaluate_intent(payload)

    return {
        "data": result.model_dump(),
        "error": None,
        "status": 200,
    }
