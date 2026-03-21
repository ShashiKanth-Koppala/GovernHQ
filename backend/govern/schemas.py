from typing import Any, Literal, Optional
from pydantic import BaseModel, Field

DecisionLiteral = Literal["allow", "flag", "block"]

class GovernEvaluateRequest(BaseModel):
    agent_id: str
    intent: str = Field(..., min_length=1)
    tool_name: Optional[str] = None
    arguments: Optional[dict[str, Any]] = None
    metadata: dict[str, Any] = Field(default_factory=dict)

class GovernEvaluateResponse(BaseModel):
    decision: DecisionLiteral
    risk_score: float
    reason: str
    anomalies: list[str] = Field(default_factory=list)
    policy_matches: list[str] = Field(default_factory=list)
    agent_info: dict[str, Any] = Field(default_factory=dict)
