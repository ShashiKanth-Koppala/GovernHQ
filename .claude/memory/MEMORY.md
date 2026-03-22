# GovernHQ — Session Memory

## Project Status

Not a frontend-only project. Mock/localStorage state is temporary.
Actively connecting to a real backend (Supabase + FastAPI).

## What Is Complete

### AUTH & DATABASE
- Supabase project live with RLS enabled
- Google OAuth configured via GCP
- Core schema exists: Organizations, Agents, Policies, ledger_events
- Frontend auth is still mock — Supabase integration is pending
- `backend/core/auth.py` — shared `AuthError`, `get_db()` singleton, `auth_context` FastAPI dep

### lib/supabase.ts (DONE)
Created at `frontend/lib/supabase.ts`.
Exports a single `supabase` client using `NEXT_PUBLIC_SUPABASE_URL`
and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `.env.local` is present in `frontend/`.

---

## AGENTS Module

### Agents table schema
Migration: `supabase/migrations/20250305000001_alter_agents_add_columns_rls.sql`
No CREATE TABLE migration exists in repo — original columns (id, organization_id, name, description, status, created_at) were created separately; migration adds source/metadata/risk_profile + constraints + RLS.

| Column          | Type        | Notes                                              |
|-----------------|-------------|----------------------------------------------------|
| id              | uuid        | pk, gen_random_uuid()                              |
| organization_id | uuid        | not null, FK → organizations(id)                   |
| name            | text        | not null                                           |
| description     | text        | nullable                                           |
| status          | text        | default 'active', check (active/inactive/blocked)  |
| source          | text        | not null, default 'n8n', check (n8n/zapier)        |
| metadata        | jsonb       | not null, default '{}'                             |
| risk_profile    | text        | not null, default 'low', check (low/medium/high)   |
| created_at      | timestamptz | default now()                                      |

No `trust_score`, `scope`, `gate_rate`, or `permissions` field — these are NOT started.

### Agents Build Order

| Step | Task                                     | Status       |
|------|------------------------------------------|--------------|
| 1    | Supabase agents table + RLS              | ✓ Done       |
| 2    | FastAPI Agent CRUD endpoints             | ✓ Done       |
| 3    | FastAPI Agent Execution endpoint         | ✓ Done       |
| 4    | n8n & Zapier webhook receiver            | ✗ Not done   |
| 5    | Agents UI (replace mock with real calls) | ✓ Done       |

### Step 2 notes (FastAPI CRUD) — DONE
- File: `backend/agents/router.py`
- Endpoints: GET /agents, POST /agents, PATCH /agents/{id}, DELETE /agents/{id}
- Auth: `get_org_id` dep — verifies JWT, resolves org via organizations table
- DB: module-level `_db` singleton, service key, RLS bypassed (org scoping explicit)
- Response shape: `{"data": ..., "error": null, "status": int}`
- PATCH uses `exclude_none=True` — only supplied fields updated
- `_AuthError` registered in `main.py` as `legacy_auth_error_handler`

### Step 3 notes (Execution endpoint) — DONE (as of 2026-03-17)
- File: `backend/agents/router.py` line 216
- Real implementation: fetches agent, builds `GateEvaluateRequest`, calls `evaluate_intent`, calls `log_gate_execution`
- Returns `{agent, execution, gate, log_id}` envelope
- Previous memory entry said "Pending" — this is now WRONG; it's done

### Step 4 notes (Webhooks) — NOT STARTED
- No webhook receiver endpoint exists anywhere in the codebase
- `source` field can be set manually via POST /agents body, but not from inbound webhook
- No n8n or Zapier inbound route

### Step 5 notes (Agents UI) — DONE
- File: `frontend/components/govern/agents-tab.tsx`
- Fetches from `GET /agents` via `apiFetch` with JWT from `supabase.auth.getSession()`
- `handleStatusToggle` → `PATCH /agents/{id}` (toggles active ↔ blocked)
- `handleDelete` → `DELETE /agents/{id}`
- Status mapped to StatusDot: active→allowed, inactive→paused, blocked→blocked

### Agents sprint backlog gaps (not yet implemented)
- Gate Rate per Agent — no rate/frequency field
- Identity Verification — JWT + org only; no agent-level key/signature
- Trust Score — no `trust_score` field; `risk_score` is ephemeral per Gate request
- Scope Rules per Agent — no scope or permissions field

---

## GATE Module

### Gate files
- `backend/gate/router.py` — FastAPI router, prefix `/gate`
- `backend/gate/service.py` — `evaluate_intent()` logic
- `backend/gate/schemas.py` — `GateEvaluateRequest`, `GateEvaluateResponse`
- `backend/gate/logging.py` — `log_gate_execution()` → inserts to `ledger_events`
- `backend/core/auth.py` — shared `auth_context` dep used by gate router

### Gate endpoint
| Endpoint            | Auth              | Status      |
|---------------------|-------------------|-------------|
| POST /gate/evaluate | `auth_context` dep | ✓ Done     |

### GateEvaluateRequest schema
```
agent_id: str
intent: str (min_length=1)
metadata: dict (default {})
```

### GateEvaluateResponse schema

```
decision: "allow" | "pause" | "block"
risk_score: float
reason: str
policy_matches: list[str]
```

### evaluate_intent logic (gate/service.py) — as of 2026-03-17

Queries Supabase `policies` table (org-scoped, status='active').
Matching: policy `condition` column is a case-insensitive substring of the intent.
Priority: block > review/pause > log > none → allow.
`risk_profile` param kept for backward compatibility but no longer affects decision.

Assumed policies table columns (no migration exists in repo):
- `organization_id` uuid — org scoping
- `status` text — filtered to 'active' only
- `name` text — returned in policy_matches
- `action` text — 'block' / 'review' / 'log' (from README)
- `condition` text — substring to match against intent (from sprint spec)

### Ledger logging — as of 2026-03-17

- `log_gate_execution()` now requires `org_id` and inserts `{organization_id, agent_id, action, status, metadata}`
- Called in BOTH `gate/router.py` and `agents/router.py`
- Migration file created: `supabase/migrations/20250305000002_create_ledger_events.sql` — NOT YET APPLIED to Supabase

### Gate Build Order

| Step | Task                                         | Status       |
|------|----------------------------------------------|--------------|
| 1    | POST /gate/evaluate endpoint                 | ✓ Done       |
| 2    | GateEvaluateRequest / Response schemas       | ✓ Done       |
| 3    | evaluate_intent() — policy table queries     | ✓ Done       |
| 4    | "pause" decision type aligned with spec      | ✓ Done       |
| 5    | Ledger write on every decision               | ✓ Done       |
| 6    | ledger_events CREATE TABLE migration         | ✓ Done (not applied) |
| 7    | Scope enforcement per agent                  | ✗ Not done   |
| 8    | Gate latency measurement / logging           | ✗ Not done   |

### Key Gate notes
- `evaluate_intent` is called directly from agents router (not via HTTP) — tight coupling
- Gate router uses `core.auth.auth_context`; agents router uses its own `get_org_id` — two separate auth flows
- `risk_profile` param preserved in evaluate_intent signature but no longer affects decision
- No latency tracking anywhere in Gate pipeline
- policies table has NO migration file in repo — must be applied manually; schema assumed from README + sprint spec

---

## Organizations table
`id, name, owner_id, created_at`
No `public.users` table — auth handled entirely by `auth.users`.
RLS pattern: `organization_id in (select id from organizations where owner_id = auth.uid())`

---

## SDK LAYER (added 2026-03-21)

### New files

- `backend/sdk/__init__.py` — empty module stub
- `backend/sdk/interceptor.py` — server-side tool interceptor
- `backend/core/ratelimit.py` — per-org sliding-window rate limiter

### Gate schema extensions

`GateEvaluateRequest` now has:

- `tool_name: Optional[str]` — tool being called (from SDK branch PR #10)
- `arguments: Optional[dict]` — call arguments (from SDK branch PR #10)

`GateEvaluateResponse` now has:

- `agent_info: dict` — name/status/risk_profile fetched from agents table

### Rate limiting

`backend/core/ratelimit.py` — `check_rate_limit(org_id) -> bool`
Max 100 calls per 60-second sliding window, per org.
In-process dict; resets on server restart (MVP only).
`gate/router.py` returns 429 if limit exceeded.

### Interceptor

`GovernHQInterceptor(org_id, agent_id)` — wraps Python callables.
Calls `evaluate_intent()` directly (no HTTP). Logs via `log_gate_execution()`.
`GovernHQBlockedError` raised on block. Pause = logged, tool still runs.
`.wrap(fn)` imperative API; `.govern_tool()` decorator API.

### What was rejected from PR #10 (feature/governance-layer)

- `/govern/evaluate` endpoint — duplicate of `/gate/evaluate`, causes double-logging
- `govern/service.py` — uses wrong policy schema (`keywords` vs `condition`)
- `python-dotenv` import in `main.py` — already handled via `--env-file`
- SDK branch's `main.py` — removes CORS and monitoring/webhooks routers
- "flag" decision literal — banned; must be "pause" everywhere
