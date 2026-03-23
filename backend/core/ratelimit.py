"""
Per-org sliding-window rate limiter — GovernHQ

Limits POST /gate/evaluate to 100 calls per 60 seconds per org.
State is in-process (dict); resets on server restart.  Suitable for MVP.
For multi-process deployments replace with a Redis-backed counter.
"""

from __future__ import annotations

import logging
import time
from collections import defaultdict

logger = logging.getLogger(__name__)

_WINDOW_SECONDS = 60
_MAX_CALLS = 20

# {org_id: [timestamp, ...]}  — sorted ascending, pruned on each check
_windows: dict[str, list[float]] = defaultdict(list)



def check_rate_limit(org_id: str) -> bool:
    key = str(org_id)
    now = time.monotonic()
    cutoff = now - _WINDOW_SECONDS

    calls = _windows[key]

    # Prune FIRST, then log and check
    while calls and calls[0] < cutoff:
        calls.pop(0)

    logger.warning(f"RATELIMIT: org={key} window_count={len(calls)}")

    if len(calls) >= _MAX_CALLS:
        return False

    calls.append(now)
    return True
