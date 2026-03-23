"""
Webhook inbound router — GovernHQ

POST /webhook/inbound

Accepts events from n8n / Zapier workflows.  Auth is via a static shared
secret (X-Webhook-Secret header) rather than a user JWT, because the caller
is an automation platform, not a browser session.

Flow:
  1. Verify X-Webhook-Secret against WEBHOOK_SECRET env var → 401 if wrong.
  2. Resolve org_id from organizations.api_key = body.org_api_key → 403 if missing.
  3. Upsert agent by (name + source + org_id):
       - exists  → update metadata.last_seen timestamp
       - missing → insert with status="active", risk_profile="low"
  4. Run Gate evaluation via evaluate_intent().
  5. Log decision to ledger_events via log_gate_execution().
  6. Return { decision, risk_score, reason, policy_matches, agent_id }.

Environment variables required:
  WEBHOOK_SECRET   — shared secret set in .env and in n8n/Zapier HTTP node header
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from core.auth import get_db
from gate.logging import log_gate_execution
from gate.schemas import GateEvaluateRequest
from gate.service import evaluate_intent

router = APIRouter(prefix="/webhook", tags=["webhook"])


# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------

def _ok(data: object, status: int = 200) -> JSONResponse:
    return JSONResponse({"data": data, "error": None, "status": status}, status_code=status)


def _err(message: str, status: int) -> JSONResponse:
    return JSONResponse({"data": None, "error": message, "status": status}, status_code=status)


# ---------------------------------------------------------------------------
# Request schema
# ---------------------------------------------------------------------------

class WebhookInboundRequest(BaseModel):
    source: Literal["n8n", "zapier"]
    agent_name: str
    org_api_key: str
    intent: str


# ---------------------------------------------------------------------------
# POST /webhook/inbound
# ---------------------------------------------------------------------------

@router.post("/inbound")
def webhook_inbound(
    body: WebhookInboundRequest,
    
    # Explicit alias ensures FastAPI binds the exact header name you send.
    secret: str | None = Header(default=None, alias="X-Webhook-Secret"),

) -> JSONResponse:
    # 1. Verify shared secret
    expected = os.environ.get("WEBHOOK_SECRET", "")
    if not expected:
        return _err("Webhook secret not configured on server", 500)
    
    if secret != expected:
        return _err("Invalid or missing X-Webhook-Secret", 401)

    if not body.intent or not body.intent.strip():
        return _err("intent must not be empty", 400)

    db = get_db()

    # 2. Resolve org_id from api_key
    org_resp = db.table("organizations").select("id").eq("api_key", body.org_api_key).limit(1).execute()
    org_rows = org_resp.data or []

    if not org_rows:
        return _err("Organization not found for provided api_key", 403)

    org_id: str = org_rows[0]["id"]

    # 3. Upsert agent by (name + source + org_id)
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
            .insert(
                {
                    "organization_id": org_id,
                    "name": body.agent_name,
                    "source": body.source,
                    "status": "active",
                    "risk_profile": "low",
                    "metadata": {"last_seen": now_iso},
                }
            )
            .execute()
        )
        
        if not insert_resp or not insert_resp.data:
            return _err("Failed to register agent", 500)
        agent_id = insert_resp.data[0]["id"]

    # 4. Gate evaluation
    gate_payload = GateEvaluateRequest(
        agent_id=agent_id,
        intent=body.intent,
        metadata={"source": body.source},
    )
    gate_result = evaluate_intent(gate_payload, org_id=org_id)

    # 5. Log to ledger
    log_gate_execution(
        agent_id=agent_id,
        intent=body.intent,
        decision=gate_result.decision,
        metadata={"source": body.source},
        org_id=org_id,
    )

    # 6. Return Gate decision
    return _ok(
        {
            "agent_id": agent_id,
            "decision": gate_result.decision,
            "risk_score": gate_result.risk_score,
            "reason": gate_result.reason,
            "policy_matches": gate_result.policy_matches,
        }
    )
