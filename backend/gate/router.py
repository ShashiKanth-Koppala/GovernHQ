import time
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from backend.core.auth import auth_context, get_db
from backend.core.ratelimit import check_rate_limit
from backend.monitoring.anomaly import detect_anomalies
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
    db = get_db()

    if not check_rate_limit(str(org_id)):
        raise HTTPException(
            status_code=429,
            detail={"data": None, "error": "rate limit exceeded", "status": 429},
        )

    trace_id = str(uuid4())

    # Monitor layer: detect behavioral anomalies and auto-block agent if any rule fires
    anomaly = detect_anomalies(payload.agent_id, org_id, db)

    t0 = time.monotonic()
    result = evaluate_intent(payload, org_id=org_id)
    elapsed_ms = round((time.monotonic() - t0) * 1000, 1)
    result.trace_id = trace_id

    # Fetch agent display info for the response (best-effort; never fails the request)
    agent_info: dict = {}
    try:
        agent_resp = db.table("agents").select("name, status, risk_profile").eq("id", payload.agent_id).limit(1).execute()
        if agent_resp.data:
            agent_info = agent_resp.data[0]
    except Exception:
        pass

    result.agent_info = agent_info

    # Build log metadata: always include risk_score (required for anomaly Rule 3 on next call);
    # merge any caller-supplied metadata; annotate anomaly if detected.
    log_metadata: dict = dict(payload.metadata or {})
    log_metadata["risk_score"] = result.risk_score
    if result.decision == "block":
        log_metadata["block_latency_ms"] = elapsed_ms
    if anomaly["anomaly"]:
        log_metadata["anomaly"]        = True
        log_metadata["anomaly_reason"] = anomaly["anomaly_reason"]

    log_row = log_gate_execution(
        agent_id=payload.agent_id,
        intent=payload.intent,
        decision=result.decision,
        metadata=log_metadata,
        org_id=org_id,
        tool_name=payload.tool_name,
    )

    return {
        "data": {
            **result.model_dump(),
            "anomaly":          anomaly["anomaly"],
            "anomaly_reason":   anomaly["anomaly_reason"],
            "organization_id":  org_id,
            "user_id":          ctx["user_id"],
            "log_id":           log_row["id"] if log_row else None,
        },
        "error": None,
        "status": 200,
    }
