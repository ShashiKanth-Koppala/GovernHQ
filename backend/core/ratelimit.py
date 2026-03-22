"""
Per-org sliding-window rate limiter — GovernHQ

Limits POST /gate/evaluate to 100 calls per 60 seconds per org.
State is in-process (dict); resets on server restart.  Suitable for MVP.
For multi-process deployments replace with a Redis-backed counter.
"""

from __future__ import annotations

import time
from collections import defaultdict

_WINDOW_SECONDS = 60
_MAX_CALLS = 100

# {org_id: [timestamp, ...]}  — sorted ascending, pruned on each check
_windows: dict[str, list[float]] = defaultdict(list)


def check_rate_limit(org_id: str) -> bool:
    """
    Return True if the org is within the rate limit and record this call.
    Return False if the limit has been exceeded (caller should return 429).
    """
    now = time.monotonic()
    cutoff = now - _WINDOW_SECONDS

    calls = _windows[org_id]

    # Prune timestamps outside the window
    while calls and calls[0] < cutoff:
        calls.pop(0)

    if len(calls) >= _MAX_CALLS:
        return False

    calls.append(now)
    return True
