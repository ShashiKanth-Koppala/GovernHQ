"""
Server-side GovernHQ SDK interceptor.

GovernHQInterceptor wraps Python callables so every invocation is evaluated
by the Gate before the tool runs.  The interceptor calls evaluate_intent()
directly (no HTTP hop) — suitable for same-process agent integrations.

Usage
-----
from backend.sdk.interceptor import GovernHQInterceptor, GovernHQBlockedError

interceptor = GovernHQInterceptor(org_id="<uuid>", agent_id="<uuid>")

@interceptor.govern_tool(intent="search the web")
def web_search(query: str) -> str:
    ...

# Or wrap imperatively:
safe_fn = interceptor.wrap(web_search, intent="search the web")
result = safe_fn(query="latest news")  # raises GovernHQBlockedError if blocked
"""

from __future__ import annotations

import functools
import inspect
from typing import Any, Callable

from gate.logging import log_gate_execution
from gate.schemas import GateEvaluateRequest
from gate.service import evaluate_intent


class GovernHQBlockedError(Exception):
    """Raised when the Gate blocks a tool invocation."""

    def __init__(self, reason: str, policy_matches: list[str] | None = None):
        self.reason = reason
        self.policy_matches = policy_matches or []
        super().__init__(reason)


class GovernHQInterceptor:
    """
    Wraps callable tools and evaluates each call through the GovernHQ Gate.

    Parameters
    ----------
    org_id:    UUID of the organisation — used for policy lookup and logging.
    agent_id:  UUID of the agent whose tools are being governed.
    """

    def __init__(self, org_id: str, agent_id: str) -> None:
        self.org_id = org_id
        self.agent_id = agent_id

    # ------------------------------------------------------------------
    # Core evaluation helper
    # ------------------------------------------------------------------

    def _evaluate(
        self,
        intent: str,
        tool_name: str | None = None,
        arguments: dict[str, Any] | None = None,
        extra_metadata: dict[str, Any] | None = None,
    ) -> None:
        """
        Run Gate evaluation.  Logs the decision.
        Raises GovernHQBlockedError on block; returns None on allow/pause.
        """
        metadata: dict[str, Any] = {"source": "sdk_interceptor"}
        if extra_metadata:
            metadata.update(extra_metadata)

        payload = GateEvaluateRequest(
            agent_id=self.agent_id,
            intent=intent,
            tool_name=tool_name,
            arguments=arguments or {},
            metadata=metadata,
        )

        result = evaluate_intent(payload, org_id=self.org_id)

        log_gate_execution(
            agent_id=self.agent_id,
            intent=intent,
            decision=result.decision,
            metadata={
                **metadata,
                "tool_name": tool_name,
                "risk_score": result.risk_score,
                "policy_matches": result.policy_matches,
            },
            org_id=self.org_id,
        )

        if result.decision == "block":
            raise GovernHQBlockedError(
                reason=result.reason,
                policy_matches=result.policy_matches,
            )

        # "pause" — logged above; execution is allowed to continue so the
        # caller can surface a requires_approval response if it chooses.
        # The interceptor does not halt on pause (non-blocking review).

    # ------------------------------------------------------------------
    # Imperative wrapper
    # ------------------------------------------------------------------

    def wrap(
        self,
        fn: Callable,
        intent: str | None = None,
        tool_name: str | None = None,
    ) -> Callable:
        """
        Return a wrapped version of *fn* that passes through the Gate.

        intent defaults to "<module>.<qualname>" if not provided.
        """
        resolved_intent = intent or f"{fn.__module__}.{fn.__qualname__}"
        resolved_tool = tool_name or fn.__name__

        @functools.wraps(fn)
        def _wrapper(*args: Any, **kwargs: Any) -> Any:
            # Build a flat arguments dict from positional + keyword args
            try:
                sig = inspect.signature(fn)
                bound = sig.bind(*args, **kwargs)
                bound.apply_defaults()
                call_args = dict(bound.arguments)
            except (TypeError, ValueError):
                call_args = {"args": list(args), **kwargs}

            self._evaluate(
                intent=resolved_intent,
                tool_name=resolved_tool,
                arguments=call_args,
            )
            return fn(*args, **kwargs)

        return _wrapper

    # ------------------------------------------------------------------
    # Decorator
    # ------------------------------------------------------------------

    def govern_tool(
        self,
        intent: str | None = None,
        tool_name: str | None = None,
    ) -> Callable[[Callable], Callable]:
        """
        Decorator factory.

        @interceptor.govern_tool(intent="delete a file")
        def delete_file(path: str) -> None: ...
        """
        def decorator(fn: Callable) -> Callable:
            return self.wrap(fn, intent=intent, tool_name=tool_name)

        return decorator
