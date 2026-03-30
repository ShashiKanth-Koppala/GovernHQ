from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.core.auth import get_db
from backend.govern.service import process_evaluation
from backend.govern.schemas import GovernEvaluateRequest as GovernRequest

router = APIRouter(prefix="/webhook", tags=["webhook"])


def _ok(data: object, status: int = 200) -> JSONResponse:
    return JSONResponse({"data": data, "error": None, "status": status}, status_code=status)


def _err(message: str, status: int) -> JSONResponse:
    return JSONResponse({"data": None, "error": message, "status": status}, status_code=status)


class WebhookInboundRequest(BaseModel):
    source: Literal["n8n", "zapier"]
    agent_name: str
    org_api_key: str
    intent: str


@router.post("/inbound")
def webhook_inbound(
    body: WebhookInboundRequest,
    secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
) -> JSONResponse:
    expected = os.environ.get("WEBHOOK_SECRET", "")
    if not expected:
        return _err("Webhook secret not configured on server", 500)
    if secret != expected:
        return _err("Invalid or missing X-Webhook-Secret", 401)
    if not body.intent or not body.intent.strip():
        return _err("intent must not be empty", 400)

    db = get_db()

    org_resp = db.table("organizations").select("id").eq("api_key", body.org_api_key).limit(1).execute()
    org_rows = org_resp.data or []
    if not org_rows:
        return _err("Organization not found for provided api_key", 403)
    org_id: str = org_rows[0]["id"]

    existing_rows = (
        db.table("agents")
        .select("id, metadata")
        .eq("organization_id", org_id)
        .eq("name", body.agent_name)
        .eq("source", body.source)
        .limit(1)
        .execute()
    ).data or []

    now_iso = datetime.now(timezone.utc).isoformat()

    if existing_rows:
        agent_id: str = existing_rows[0]["id"]
        current_meta: dict = existing_rows[0].get("metadata") or {}
        current_meta["last_seen"] = now_iso
        db.table("agents").update({"metadata": current_meta}).eq("id", agent_id).execute()
    else:
        insert_resp = (
            db.table("agents")
            .insert({
                "organization_id": org_id,
                "name": body.agent_name,
                "source": body.source,
                "status": "active",
                "risk_profile": "low",
                "metadata": {"last_seen": now_iso},
            })
            .execute()
        )
        if not insert_resp or not insert_resp.data:
            return _err("Failed to register agent", 500)
        agent_id = insert_resp.data[0]["id"]

    govern_payload = GovernRequest(
        agent_id=agent_id,
        intent=body.intent,
        metadata={"source": body.source},
    )
    gate_result = process_evaluation(govern_payload, org_id=org_id)
# Added the following below 
    # Only update metadata, never change agent status based on decision
    db.table("agents").update({
        "metadata": {
            **current_meta,
            "last_decision": gate_result.decision,
            "last_seen": now_iso
        }
    }).eq("id", agent_id).execute()
    # Added the following above 
    return _ok({
        "agent_id": agent_id,
        "decision": gate_result.decision,
        "risk_score": gate_result.risk_score,
        "reason": gate_result.reason,
        "policy_matches": gate_result.policy_matches,
    })
