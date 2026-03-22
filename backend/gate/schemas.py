from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


DecisionLiteral = Literal["allow", "pause", "block"]


class GateEvaluateRequest(BaseModel):
    agent_id: str
    intent: str = Field(..., min_length=1)
    tool_name: Optional[str] = None
    arguments: Optional[dict[str, Any]] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class GateEvaluateResponse(BaseModel):
    decision: DecisionLiteral
    risk_score: float
    reason: str
    policy_matches: list[str] = Field(default_factory=list)
    agent_info: dict[str, Any] = Field(default_factory=dict)
