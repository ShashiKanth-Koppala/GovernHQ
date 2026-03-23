"""
Settings router — GovernHQ

GET  /settings  — return org governance settings (merged with defaults)
PATCH /settings — update one or more settings fields

Settings are stored in organizations.metadata jsonb under a "settings" key.
Requires migration 000004 (add metadata column to organizations).

Auth:     Bearer JWT → org_id via core.auth.auth_context
Response: {"data": ..., "error": null/string, "status": int}

Available settings fields:
  risk_threshold       float  0.0–1.0   default 0.75
  anomaly_sensitivity  float  0.0–1.0   default 0.50
  enforcement_mode     str    "active" | "monitor" | "shadow"  default "active"
  fail_mode            str    "open" | "closed"                default "open"
"""

from __future__ import annotations

from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from backend.core.auth import auth_context, get_db

router = APIRouter(prefix="/settings", tags=["settings"])

_DEFAULTS: dict[str, Any] = {
    "risk_threshold": 0.75,
    "anomaly_sensitivity": 0.50,
    "enforcement_mode": "active",
    "fail_mode": "open",
}

_SETTINGS_KEY = "settings"


# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------

def _ok(data: Any, status: int = 200) -> JSONResponse:
    return JSONResponse({"data": data, "error": None, "status": status}, status_code=status)


def _err(message: str, status: int) -> JSONResponse:
    return JSONResponse({"data": None, "error": message, "status": status}, status_code=status)


# ---------------------------------------------------------------------------
# Request schema
# ---------------------------------------------------------------------------

class SettingsPatch(BaseModel):
    risk_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    anomaly_sensitivity: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    enforcement_mode: Optional[Literal["active", "monitor", "shadow"]] = None
    fail_mode: Optional[Literal["open", "closed"]] = None


# ---------------------------------------------------------------------------
# GET /settings
# ---------------------------------------------------------------------------

@router.get("")
def get_settings(ctx: dict = Depends(auth_context)) -> JSONResponse:
    org_id = ctx["organization_id"]
    db = get_db()

    resp = (
        db.table("organizations")
        .select("metadata")
        .eq("id", org_id)
        .limit(1)
        .execute()
    )
    rows = resp.data or []
    if not rows:
        return _err("Organization not found", 404)

    metadata = rows[0].get("metadata") or {}
    stored   = metadata.get(_SETTINGS_KEY) or {}

    # Merge stored values over defaults — only known keys
    result = {k: stored.get(k, v) for k, v in _DEFAULTS.items()}
    return _ok(result)


# ---------------------------------------------------------------------------
# PATCH /settings
# ---------------------------------------------------------------------------

@router.patch("")
def update_settings(
    body: SettingsPatch,
    ctx: dict = Depends(auth_context),
) -> JSONResponse:
    updates = body.model_dump(exclude_none=True)
    if not updates:
        return _err("No fields to update", 400)

    org_id = ctx["organization_id"]
    db = get_db()

    # Read current metadata
    resp = (
        db.table("organizations")
        .select("metadata")
        .eq("id", org_id)
        .limit(1)
        .execute()
    )
    rows = resp.data or []
    if not rows:
        return _err("Organization not found", 404)

    metadata = dict(rows[0].get("metadata") or {})
    current_settings = dict(metadata.get(_SETTINGS_KEY) or {})
    current_settings.update(updates)
    metadata[_SETTINGS_KEY] = current_settings

    db.table("organizations").update({"metadata": metadata}).eq("id", org_id).execute()

    # Return the full merged settings
    result = {k: current_settings.get(k, v) for k, v in _DEFAULTS.items()}
    return _ok(result)
