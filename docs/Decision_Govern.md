## How GovernHQ Makes Decisions

### The Three Outcomes

Every time an agent wants to do something, it sends its **intent** — a plain text description of what it's about to do — to the Gate. The Gate returns one of three decisions:

**Allow** — the action is clean. No blocking or review policy matched, no hard scope violation. The agent executes its tool normally. Risk score is set to 0.20.

**Pause** — the action needs review. A policy with `action: "review"` matched, or the agent's scope requires clearance for the planned action type (e.g., file export without PII clearance). The decision is logged. Risk score is 0.55–0.70 depending on whether scope or policy triggered it.

**Block** — the action is forbidden. A policy with `action: "block"` matched, or the agent's scope explicitly prohibits the action type. The tool call never executes. `GovernHQBlockedError` is raised if using the SDK. Risk score is 0.90–0.95.

---

### The Full Decision Pipeline

Every call to `POST /gate/evaluate` (or `GovernHQInterceptor._evaluate()`) goes through this sequence in order:

```
Agent sends intent
        ↓
1. AUTH
   JWT validated → org_id resolved
   → Invalid: 401, request rejected

2. RATE LIMIT  (backend/core/ratelimit.py)
   Sliding window: 20 calls per org per 60 seconds (in-process, resets on restart)
   → Exceeded: 429, Gate never runs

3. ANOMALY DETECTION  (backend/monitoring/anomaly.py)
   Checks 3 behavioral rules against recent ledger_events for this agent:
     Rule 1 — High frequency:   >10 gate calls from this agent in last 60s
     Rule 2 — Repeated blocks:  >3 blocked decisions in last 5 minutes
     Rule 3 — Risk spike:       most recent ledger event has metadata.risk_score > 0.95

   If any rule fires:
     → agent.status set to 'blocked' (auto-blocked, blocked_by='monitor')
     → anomaly=True + anomaly_reason written to log metadata

   The current Gate request still proceeds to Step 4 regardless.
   Anomaly detection never crashes the Gate request (any exception → anomaly=False).

4. GATE EVALUATION  (backend/gate/service.py — evaluate_intent())
   Evaluated in strict priority order — first match wins and returns immediately:

   Step 1 — POLICY BLOCK
     Query policies table (is_enabled=true, org-scoped)
     Match: rule.condition is a non-empty case-insensitive substring of intent
     Any policy with action="block" matches → decision=block, risk_score=0.95

   Step 2 — SCOPE BLOCK
     Fetch agent.scope from agents table
     Classify intent into action type (first keyword match wins):
       DB_WRITE:     delete, drop, truncate, update, insert, write, remove
       NOTIFICATION: send, email, notify, message, sms, alert, post
       FILE_IO:      export, download, extract, dump, backup, output
       API_CALL:     api, call, request, fetch, webhook, http
       (no match) → DB_QUERY
     Hard scope violations → decision=block, risk_score=0.90:
       DB_WRITE  + scope.databases is empty
       NOTIFICATION + scope.external_calls == false
     (empty scope {} = unrestricted — all scope checks skipped)

   Step 3 — POLICY PAUSE
     Any enabled policy with action="review" matches → decision=pause, risk_score=0.70

   Step 4 — SCOPE PAUSE
     Soft scope violations → decision=pause, risk_score=0.55:
       FILE_IO + scope.pii_level == "none" (file exports require PII clearance)

   Step 5 — POLICY LOG
     Any enabled policy with action="log" matches → decision=allow, risk_score=0.20

   Step 6 — ALLOW
     No match → decision=allow, risk_score=0.20

5. FAIL OPEN / FAIL CLOSED
   If the DB is unreachable during Steps 1–5, the gate reads
   organizations.metadata.fail_mode:
     "open"   → allow (risk_score=0.20)
     "closed" → block (risk_score=0.95)  ← default if unset

6. AUDIT LOG  (backend/gate/logging.py)
   Every decision written to ledger_events:
     agent_id, intent (as action), status (decision), org_id
     action_type (classified from intent/tool_name)
     prev_hash (SHA-256 chain link)
     metadata: risk_score, gate_ms, anomaly flag, anomaly_reason,
               block_latency_ms (if blocked), policy_matches
```

---

### Risk Scores Are Fixed Per Decision Tier

There is no weighted formula. Risk scores are assigned based on which step in the pipeline triggered the decision:

| Trigger | Decision | risk_score |
| ------- | -------- | ---------- |
| Policy block | block | 0.95 |
| Scope block (hard violation) | block | 0.90 |
| DB unavailable, fail closed | block | 0.95 |
| Policy review | pause | 0.70 |
| Scope pause (soft violation) | pause | 0.55 |
| Policy log | allow | 0.20 |
| No match | allow | 0.20 |
| DB unavailable, fail open | allow | 0.20 |

The `risk_score` stored in `ledger_events.metadata` is this per-tier value. It is used by anomaly Rule 3 on the *next* call — if the previous action scored > 0.95, the agent is flagged as a risk spike.

---

### What Gets Blocked — The Action or the Agent?

**The Gate blocks actions.** Each intent is evaluated independently. A blocked decision does not change the agent's `status`.

**The Monitor blocks agents.** `detect_anomalies()` runs before every Gate evaluation. If behavioral rules fire (high frequency, repeated blocks, or risk spike), the agent's `status` is set to `blocked` in the database. A blocked agent's future Gate calls may still be processed, but the agent will be flagged in the UI (Shield tab) and admins can review it.

Admins can also manually block all agents via `POST /shield/block-all`, or unblock individual agents via `POST /shield/agents/{id}/allow`.

---

### Scope Enforcement

Scope is defined per-agent in `agents.scope` (JSONB). Fields:

| Field | Type | Effect |
| ----- | ---- | ------ |
| `databases` | string[] | Required for DB_WRITE actions; empty = write blocked |
| `external_calls` | bool | `false` = NOTIFICATION actions blocked |
| `pii_level` | string | `"none"` = FILE_IO actions paused for review |
| `apis` | string[] | Informational; not enforced in Gate today |
| `max_rows` | int | Informational; not enforced in Gate today |

An agent with no scope (`{}`) is unrestricted — all scope checks are skipped.

---

### SDK Interceptor

`GovernHQInterceptor` (backend/sdk/interceptor.py) wraps Python callables so every invocation is evaluated by the Gate before the tool runs. It calls `evaluate_intent()` directly — no HTTP hop.

```python
interceptor = GovernHQInterceptor(org_id="<uuid>", agent_id="<uuid>")

@interceptor.govern_tool(intent="delete all records")
def delete_records(): ...
# Raises GovernHQBlockedError if Gate returns block
# Logs the decision to ledger_events regardless of outcome
# "pause" decisions are logged but do not halt execution
```

The interceptor always logs via `log_gate_execution()`. `block` raises `GovernHQBlockedError`. `pause` is logged and execution continues — the caller is responsible for surfacing a requires-approval response.

---

### Action Type Classification

Every ledger event is tagged with an `action_type` (stored in `ledger_events.action_type`). Classification checks `tool_name` first, then falls back to keyword scanning of the intent string:

| action_type | Keywords |
| ----------- | -------- |
| DB_QUERY | query, select, fetch, retrieve, read, get, find, search, lookup |
| DB_WRITE | write, insert, update, delete, mutate, create, put, patch, upsert |
| API_CALL | api call, http, request, webhook, endpoint, rest, graphql |
| FILE_IO | file, upload, download, read file, write file, blob, s3 |
| NOTIFICATION | email, sms, message, send, notify, notification, slack, alert, broadcast |
| AGENT_ACTION | (no keyword match) |

Note: scope enforcement uses a separate but related keyword set defined in `gate/service.py`. The two classifiers may assign different types for the same intent — `action_type` on the ledger is for observability; the scope classifier drives enforcement.

---

### Practical Summary

| Scenario | Outcome |
| -------- | ------- |
| Clean intent, no matching policy | allow |
| Intent matches a "review" policy | pause |
| Intent matches a "block" policy | block |
| DB_WRITE intent, agent has no databases in scope | block (scope) |
| FILE_IO intent, agent has pii_level="none" | pause (scope review) |
| NOTIFICATION intent, scope.external_calls=false | block (scope) |
| Agent has no scope defined (`{}`) | scope checks skipped |
| DB unavailable, org has fail_mode="open" | allow (fallback) |
| DB unavailable, fail_mode unset or "closed" | block (fallback) |
| >20 Gate calls from org in last 60s | 429, Gate skipped |
| Agent sent >10 calls in 60s (this or prior requests) | agent auto-blocked by monitor |
| Agent received >3 blocks in last 5 min | agent auto-blocked by monitor |
| Previous action had risk_score > 0.95 | agent auto-blocked by monitor |
