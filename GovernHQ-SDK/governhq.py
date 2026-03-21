import functools
import requests
import json
from typing import Any, Callable, Dict, Optional, Tuple

class GovernHQ:
    """
    GovernHQ SDK - An embedded governance layer for AI agents.
    
    This interceptor captures tool calls before execution, sends them
    to the GovernHQ backend for evaluation, and enforces the decision.
    """
    
    def __init__(self, api_url: str, api_key: str, agent_id: str):
        """
        Initialize the GovernHQ interceptor.
        
        Args:
            api_url: URL of the GovernHQ backend.
            api_key: User's Bearer token (Supabase JWT).
            agent_id: The ID of the agent being governed.
        """
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.agent_id = agent_id

    def evaluate(self, intent: str, tool_name: str, arguments: Dict[str, Any], metadata: Dict[str, Any] = {}) -> Dict[str, Any]:
        """
        Send evaluation request to governance backend (governance_layer/evaluate).
        
        Tasks: 
        1. Capture tool call (handled by the caller)
        2. Send evaluation request
        3. Wait for decision
        """
        endpoint = f"{self.api_url}/govern/evaluate"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "agent_id": self.agent_id,
            "intent": intent,
            "tool_name": tool_name,
            "arguments": arguments,
            "metadata": metadata
        }
        
        try:
            response = requests.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json().get("data")
            if not data:
                raise Exception("Empty response from governance backend.")
            return data
        except Exception as e:
            # Safe default: block action on governance failure to ensure safety
            return {
                "decision": "block",
                "reason": f"Governance connection error: {str(e)}",
                "risk_score": 1.0
            }

    def govern_tool(self, intent_provider: Optional[Callable] = None):
        """
        Decorator to wrap agent tools. 
        Automatically captures the tool call and arguments.
        """
        def decorator(func: Callable):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                # 1. Capture tool call
                tool_name = func.__name__
                # Combine args and kwargs into a serializable dict
                arguments = {
                    "args": list(args),
                    "kwargs": kwargs
                }
                
                # Dynamic intent extraction
                intent = None
                if intent_provider:
                    try:
                        intent = intent_provider(*args, **kwargs)
                    except:
                        pass
                
                if not intent:
                    intent = f"Executing agent tool '{tool_name}' with arguments: {json.dumps(arguments)}"
                
                # 2 & 3. Send evaluation request and Wait for decision
                evaluation = self.evaluate(intent, tool_name, arguments)
                
                decision = evaluation.get("decision", "block")
                reason = evaluation.get("reason", "No reason provided")
                risk_score = evaluation.get("risk_score", 0.0)
                
                if decision == "block":
                    raise PermissionError(f"[GovernHQ DENIED] Action '{tool_name}' blocked by policy. Reason: {reason}")
                
                if decision == "flag":
                    print(f"[GovernHQ FLAGGED] Action '{tool_name}' flagged (Risk: {risk_score}). Reason: {reason}")
                
                # Proceed with tool execution
                return func(*args, **kwargs)
                
            return wrapper
        return decorator

# Example Usage:
# gq = GovernHQ(api_url="http://localhost:8000", api_key="YOUR_TOKEN", agent_id="AGENT_UUID")
#
# @gq.govern_tool()
# def send_payment(amount, recipient):
#     # This code only runs if GovernHQ allows it
#     print(f"Sending ${amount} to {recipient}")
