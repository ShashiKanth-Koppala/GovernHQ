"""
Agents CRUD router — GovernHQ

Auth:     Bearer token (Supabase JWT) required on every endpoint.
          organization_id is resolved server-side from the token via
          the organizations table (owner_id = auth.uid()).
          Client-supplied org_id is never trusted.

DB:       Supabase Python client, service key (bypasses RLS).
          Org scoping is enforced explicitly on every query.

Response: {"data": <payload | null>, "error": <message | null>, "status": <int>}
          HTTP status code matches the status field.
"""

from __future__ import annotations

import os
import time
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from supabase import Client, create_client

# ADDED BY MICHAEL
from backend.gate.logging import log_gate_execution
from backend.gate.schemas import GateEvaluateRequest
from backend.gate.service import evaluate_intent
from backend.monitoring.anomaly import detect_anomalies

router = APIRouter(prefix="/agents", tags=["agents"])

_TABLE = "agents"

# ---------------------------------------------------------------------------
# Supabase client
# One instance per process — service key bypasses RLS.
# ---------------------------------------------------------------------------

def _client() -> Client:
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"],
    )

_db: Client = _client()

# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------

def _ok(data: Any, status: int = 200) -> JSONResponse:
    return JSONResponse({"data": data, "error": None, "status": status}, status_code=status)

def _err(message: str, status: int) -> JSONResponse:
    return JSONResponse({"data": None, "error": message, "status": status}, status_code=status)

# ---------------------------------------------------------------------------
# Auth dependency
# Verifies JWT via Supabase, resolves organization_id from organizations table.
# ---------------------------------------------------------------------------

def get_org_id(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise _AuthError("Missing or invalid token", 401)
    token = authorization.removeprefix("Bearer ")

    try:
        user_resp = _db.auth.get_user(token)
    except Exception:
        raise _AuthError("Invalid or expired token")

    user_id = user_resp.user.id

    result = (
        _db.table("organizations")
        .select("id")
        .eq("owner_id", user_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise _AuthError("No organization found for this user")

    return result.data["id"]


class _AuthError(Exception):
    def __init__(self, detail: str, status: int = 401):
        self.detail = detail
        self.status = status


# FastAPI exception handler shim — register this in main.py:
#   @app.exception_handler(_AuthError)
#   async def auth_error_handler(request, exc):
#       return JSONResponse(
#           {"data": None, "error": exc.detail, "status": exc.status},
#           status_code=exc.status,
#       )

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AgentCreate(BaseModel):
    name: str
    source: Literal["n8n", "zapier"]
    metadata: dict = {}
    risk_profile: Literal["low", "medium", "high"] = "low"
    verified: bool = False
    scope: dict = {}  # {} = unrestricted; set fields to enforce gate scope


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    source: Optional[Literal["n8n", "zapier"]] = None
    metadata: Optional[dict] = None
    risk_profile: Optional[Literal["low", "medium", "high"]] = None
    status: Optional[Literal["active", "inactive", "blocked"]] = None
    verified: Optional[bool] = None
    scope: Optional[dict] = None  # None = no change; {} = clear scope (unrestricted)


# ADDED BY MICHAEL
class AgentExecuteRequest(BaseModel):
    intent: str
    metadata: dict = {}


# ---------------------------------------------------------------------------
# Intelligence helpers
# Compute trust_score (0–100) and gate_rate (0.0–100.0 | None) per agent
# from ledger_events rows. Called inside list_agents after fetching all events
# for the org in a single query.
# ---------------------------------------------------------------------------

def _build_agent_stats(ledger_rows: list[dict]) -> dict[str, dict[str, int]]:
    stats: dict[str, dict[str, int]] = {}
    for row in ledger_rows:
        aid = row.get("agent_id")
        if not aid:
            continue
        if aid not in stats:
            stats[aid] = {"total": 0, "allowed": 0, "blocked": 0, "paused": 0}
        stats[aid]["total"] += 1
        st = row.get("status", "")
        if st == "allow":
            stats[aid]["allowed"] += 1
        elif st == "block":
            stats[aid]["blocked"] += 1
        elif st == "pause":
            stats[aid]["paused"] += 1
    return stats


def _trust_score(s: dict[str, int]) -> int:
    """
    0–100. New agents start at 100. Decays with blocks, rises with allows.
    Formula: weighted allow_rate (60%) + non-block rate (40%), scaled to 100.
    """
    total = s["total"]
    if total == 0:
        return 100
    allow_rate = s["allowed"] / total
    block_rate = s["blocked"] / total
    return max(0, min(100, round((allow_rate * 0.6 + (1 - block_rate) * 0.4) * 100)))


def _gate_rate(s: dict[str, int]) -> float | None:
    """Percentage of allowed decisions out of total. None if no events yet."""
    total = s["total"]
    if total == 0:
        return None
    return round(s["allowed"] / total * 100, 1)


# ---------------------------------------------------------------------------
# GET /agents
# Returns all agents for the org, enriched with trust_score and gate_rate
# computed from ledger_events (single extra query, aggregated in Python).
# ---------------------------------------------------------------------------

@router.get("")
def list_agents(org_id: str = Depends(get_org_id)) -> JSONResponse:
    result = (
        _db.table(_TABLE)
        .select("*")
        .eq("organization_id", org_id)
        .order("created_at", desc=True)
        .execute()
    )
    agents = result.data or []

    # Fetch all ledger_events for this org (status + agent_id only — minimal payload)
    ledger_resp = (
        _db.table("ledger_events")
        .select("agent_id, status")
        .eq("organization_id", org_id)
        .execute()
    )
    stats = _build_agent_stats(ledger_resp.data or [])

    for agent in agents:
        s = stats.get(agent["id"], {"total": 0, "allowed": 0, "blocked": 0, "paused": 0})
        agent["trust_score"] = _trust_score(s)
        agent["gate_rate"] = _gate_rate(s)

    return _ok(agents)


# ---------------------------------------------------------------------------
# POST /agents
# Creates a new agent. organization_id is injected from the JWT — never
# accepted from the request body.
# ---------------------------------------------------------------------------

@router.post("", status_code=201)
def create_agent(body: AgentCreate, org_id: str = Depends(get_org_id)) -> JSONResponse:
    result = (
        _db.table(_TABLE)
        .insert({**body.model_dump(), "organization_id": org_id})
        .execute()
    )
    return _ok(result.data[0], status=201)


# ---------------------------------------------------------------------------
# PATCH /agents/{agent_id}
# Updates allowed fields on an agent. Scoped to caller's org — an agent
# belonging to a different org silently returns 404.
# ---------------------------------------------------------------------------

@router.patch("/{agent_id}")
def update_agent(
    agent_id: str,
    body: AgentUpdate,
    org_id: str = Depends(get_org_id),
) -> JSONResponse:
    updates = body.model_dump(exclude_none=True)
    if not updates:
        return _err("No fields to update", status=400)

    result = (
        _db.table(_TABLE)
        .update(updates)
        .eq("id", agent_id)
        .eq("organization_id", org_id)
        .execute()
    )
    if not result.data:
        return _err("Agent not found", status=404)
    return _ok(result.data[0])


# ---------------------------------------------------------------------------
# DELETE /agents/{agent_id}
# Deletes an agent. Scoped to caller's org — wrong org silently returns 404.
# ---------------------------------------------------------------------------

@router.delete("/{agent_id}")
def delete_agent(agent_id: str, org_id: str = Depends(get_org_id)) -> JSONResponse:
    result = (
        _db.table(_TABLE)
        .delete()
        .eq("id", agent_id)
        .eq("organization_id", org_id)
        .execute()
    )
    if not result.data:
        return _err("Agent not found", status=404)
    return _ok(result.data[0])


# ---------------------------------------------------------------------------
# POST /agents/{agent_id}/execute
# ADDED BY MICHAEL: verifies the agent belongs to the caller's org, evaluates
# the requested action through Gate, logs the decision to ledger_events, and
# returns the governed execution result.
# ---------------------------------------------------------------------------

@router.post("/{agent_id}/execute")
def execute_agent(
    agent_id: str,
    body: AgentExecuteRequest,
    org_id: str = Depends(get_org_id),
) -> JSONResponse:
    result = (
        _db.table(_TABLE)
        .select("id, name, status, risk_profile, organization_id")
        .eq("id", agent_id)
        .eq("organization_id", org_id)
        .maybe_single()
        .execute()
    )

    if not result.data:
        return _err("Agent not found", status=404)

    agent = result.data

    gate_payload = GateEvaluateRequest(
        agent_id=agent_id,
        intent=body.intent,
        metadata=body.metadata,
    )

    # Monitor layer: detect behavioral anomalies and auto-block agent if any rule fires
    anomaly = detect_anomalies(agent_id, org_id, _db)

    t0 = time.monotonic()
    gate_result = evaluate_intent(
        gate_payload,
        org_id=org_id,
        risk_profile=agent.get("risk_profile"),
    )
    elapsed_ms = round((time.monotonic() - t0) * 1000, 1)

    # Build log metadata: always include risk_score (required for anomaly Rule 3);
    # annotate anomaly if detected.
    log_metadata: dict = dict(body.metadata or {})
    log_metadata["risk_score"] = gate_result.risk_score
    if gate_result.decision == "block":
        log_metadata["block_latency_ms"] = elapsed_ms
    if anomaly["anomaly"]:
        log_metadata["anomaly"]        = True
        log_metadata["anomaly_reason"] = anomaly["anomaly_reason"]

    log_row = log_gate_execution(
        agent_id=agent_id,
        intent=body.intent,
        decision=gate_result.decision,
        metadata=log_metadata,
        org_id=org_id,
    )

    return _ok(
        {
            "agent": {
                "id": agent["id"],
                "name": agent.get("name"),
                "status": agent.get("status"),
                "risk_profile": agent.get("risk_profile"),
            },
            "execution": {
                "intent": body.intent,
                "metadata": body.metadata,
            },
            "gate": gate_result.model_dump(),
            "anomaly": anomaly["anomaly"],
            "anomaly_reason": anomaly["anomaly_reason"],
            "log_id": log_row["id"] if log_row and "id" in log_row else None,
        }
    )
