# GovernHQ

Github Repository for Team 12 - GovernHQ

An embedded governance layer for multi-agent AI systems. GovernHQ intercepts AI agent intent **before** actions are executed — evaluating reasoning against policy, assigning a risk score, and either allowing or blocking the action.

---

## Architecture Overview

```
frontend/          → Next.js 16 (App Router) + TypeScript + Shadcn/ui
backend/           → FastAPI (Python)
supabase/          → Postgres + RLS migrations
```

```
AI Agents (n8n / Zapier / Custom)
        ↓
   GovernHQ SDK  (backend/sdk/interceptor.py)
   · Wraps tool calls before execution
   · Captures intent + arguments
   · Enforces block decisions
        ↓
   Gate (FastAPI — POST /gate/evaluate)
   · Identity: org resolved from JWT or webhook API key
   · Policy Engine: queries policies table (block / review / log)
   · Risk Scoring: weighted model (agent + intent + anomaly)
   · Anomaly Detection: frequency, repeated blocks, risk spike
   · Rate Limiting: 100 calls / 60s per org
        ↓
   Allow / Pause / Block
        ↓
   Audit Logger → ledger_events (risk_score, anomaly flag, policy_matches)
        ↓
   Dashboard (React)
   · Manage Policies
   · View Decisions Log (ledger-tab)
   · Monitor Agents (monitoring-tab)
   · Review Queue (paused decisions)
   · Shield Controls (enforcement mode, thresholds)
   · Webhooks UI (n8n / Zapier inbound events)
```

---

## Module Ownership

| Module     | Owner              | Status       |
| ---------- | ------------------ | ------------ |
| AUTH & DB  | Mfurlan03          | ✅ Complete  |
| GATE       | Mfurlan03 and Sami | ✅ Complete  |
| AGENTS     | Sami Malek         | ✅ Complete  |
| MONITORING | Shalini S K        | ✅ Complete  |
| DEPLOYMENT | Didn't define yet  | ⏸️ Pending |

---

## What Is Complete

- Supabase project live — RLS enabled on all tables
- Google OAuth configured via GCP + Supabase Auth
- Core schema: `organizations`, `policies`, `ledger_events`, `agents`
- `lib/supabase.ts` — single Supabase client instance
- Agents CRUD endpoints — `backend/agents/router.py`
- Agents UI — `components/govern/agents-tab.tsx` wired to real API
- Execute endpoint — stub at `POST /agents/{id}/execute`, pending Gate integration

---

## Prerequisites

- Node.js 18+
- Python 3.11+
- pnpm — install with `npm install -g pnpm`
- Access to the Supabase project (request invite from Mfurlan03)

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
pnpm install
```

### 2. Create environment file

Create `frontend/.env.local` — **never commit this file**:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> Get `SUPABASE_URL` and `SUPABASE_ANON_KEY` from Supabase dashboard → Settings → API.
> Google OAuth is already configured inside Supabase — no Google client ID/secret needed locally.

### 3. Run development server

```bash
pnpm dev
```

App runs at `http://localhost:3000`

### Other commands

```bash
pnpm build    # Production build
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

---

## Backend Setup

### 1. Create virtual environment

```bash
cd backend
python -m venv venv

# Mac/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Create environment file

Create `backend/.env` — **never commit this file**:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

> `SUPABASE_SERVICE_KEY` is the service role key (not anon key) — found in Supabase dashboard → Settings → API.
> The service key bypasses RLS — org scoping is enforced explicitly in every endpoint.

### 4. Run development server

```bash
uvicorn main:app --reload --port 8000
```

API runs at `http://localhost:8000`

---

## Database

Migrations are in `supabase/migrations/`. They are applied manually via the Supabase SQL Editor.

### Current tables

| Table             | Description                               |
| ----------------- | ----------------------------------------- |
| `organizations` | Orgs — linked to auth.users via owner_id |
| `agents`        | Registered AI agents (n8n / Zapier)       |
| `policies`      | Governance policies (block/review/log)    |
| `ledger_events` | Execution log / audit trail               |

### To apply a migration

1. Go to Supabase dashboard → SQL Editor
2. Paste the contents of the migration file
3. Click Run

---

## Key Conventions

- Supabase client → always import from `frontend/lib/supabase.ts`, never instantiate directly
- Auth state → always from `frontend/lib/auth-context.tsx`
- New frontend components → `frontend/components/govern/`
- Routing → `frontend/app/` directory only (Next.js App Router)
- API responses → always `{"data": ..., "error": null, "status": int}`
- Never trust client-supplied `org_id` — always resolve from JWT

---

## Environment Files Summary

| Variable                          | File                    | Description                                                      |
| --------------------------------- | ----------------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `frontend/.env.local` | Supabase project URL                                             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `frontend/.env.local` | Supabase anon key                                                |
| `NEXT_PUBLIC_API_URL`           | `frontend/.env.local` | Backend URL (e.g.`http://localhost:8000`)                      |
| `SUPABASE_URL`                  | `backend/.env`        | Supabase project URL                                             |
| `SUPABASE_SERVICE_KEY`          | `backend/.env`        | Service role key (`sb_secret_*`) — bypasses RLS               |
| `WEBHOOK_SECRET`                | `backend/.env`        | Shared secret for inbound webhooks (`X-Webhook-Secret` header) |

Neither file is committed to git. Both are in `.gitignore`.

---

## Project Structure

```
GovernHQ/
├── frontend/
│   ├── app/                  # Next.js App Router pages
│   ├── components/
│   │   ├── govern/           # Feature tabs (agents, policies, dashboard...)
│   │   ├── auth/             # Login, signup, verify email
│   │   └── ui/               # Shadcn/Radix primitives
│   ├── lib/
│   │   ├── supabase.ts       # Single Supabase client instance
│   │   ├── auth-context.tsx  # Auth state (React Context)
│   │   └── utils.ts          # cn() helper
│   └── hooks/
├── backend/
│   ├── agents/
│   │   └── router.py         # Agent CRUD + execute stub
│   └── main.py               # FastAPI entry point (register routers here)
├── backend/
│   ├── agents/router.py      # Agent CRUD + execute + review-action
│   ├── gate/                 # Policy engine, schemas, logging
│   ├── monitoring/           # Ledger, metrics, anomalies, sources
│   ├── webhooks/             # n8n / Zapier inbound receiver
│   ├── sdk/                  # GovernHQInterceptor (server-side)
│   ├── core/                 # auth_context, get_db, ratelimit
│   └── main.py               # FastAPI entry point (all routers registered)
├── supabase/
│   └── migrations/           # SQL migration files
├── docs/
│   ├── Decision_Govern.md    # How GovernHQ Makes Decisions
│   └── n8n-integration.md    # n8n workflow setup + test guide

```

---

## API Reference

All endpoints return `{"data": ..., "error": null/string, "status": int}`.
JWT auth: `Authorization: Bearer <supabase_access_token>`.

| Method | Endpoint                       | Auth                 | Description                                          |
| ------ | ------------------------------ | -------------------- | ---------------------------------------------------- |
| GET    | `/agents`                    | JWT                  | List agents for org                                  |
| POST   | `/agents`                    | JWT                  | Register new agent                                   |
| PATCH  | `/agents/{id}`               | JWT                  | Update agent                                         |
| DELETE | `/agents/{id}`               | JWT                  | Delete agent                                         |
| POST   | `/agents/{id}/execute`       | JWT                  | Execute agent intent through Gate                    |
| POST   | `/agents/{id}/review-action` | JWT                  | Approve / reject / defer paused decision             |
| POST   | `/gate/evaluate`             | JWT                  | Evaluate intent against policies                     |
| GET    | `/monitoring/ledger`         | JWT                  | Paginated decision log                               |
| GET    | `/monitoring/metrics`        | JWT                  | Aggregate stats (total / allowed / blocked / paused) |
| GET    | `/monitoring/anomalies`      | JWT                  | Detected anomaly events                              |
| GET    | `/monitoring/sources`        | JWT                  | Per-source webhook stats (n8n / zapier)              |
| GET    | `/settings`                  | JWT                  | Get org governance settings                          |
| PATCH  | `/settings`                  | JWT                  | Update enforcement mode / thresholds                 |
| POST   | `/webhook/inbound`           | `X-Webhook-Secret` | Inbound webhook from n8n or Zapier                   |
| GET    | `/health`                    | None                 | Liveness check                                       |

**Rate limit:** 100 Gate calls / 60s per org → `429` if exceeded.

---

## SDK

The GovernHQ SDK wraps any Python callable and governs it before execution.

```python
from backend.sdk.interceptor import GovernHQInterceptor, GovernHQBlockedError

interceptor = GovernHQInterceptor(agent_id="<uuid>", org_id="<uuid>")

# Option 1 — wrap an existing function
governed_tool = interceptor.wrap(my_tool_function)

try:
    result = governed_tool(arg1, arg2)
except GovernHQBlockedError as e:
    print(f"Blocked: {e.reason} | policies: {e.policy_matches}")

# Option 2 — decorator
@interceptor.govern_tool(intent="search the web")
def web_search(query: str) -> str:
    ...
```

| Decision  | Behaviour                                                        |
| --------- | ---------------------------------------------------------------- |
| `allow` | Tool executes normally                                           |
| `pause` | Logged; tool still executes (caller surfaces approval flow)      |
| `block` | `GovernHQBlockedError` raised; tool does **not** execute |

The interceptor calls `evaluate_intent()` directly (no HTTP hop) and logs every decision to `ledger_events` via `log_gate_execution()`.

---

## Webhook Integration

See **[docs/n8n-integration.md](docs/n8n-integration.md)** for the full setup guide, workflow JSON, and end-to-end test checklist.

**Quick reference — POST /webhook/inbound:**

```json
POST /webhook/inbound
Header: X-Webhook-Secret: <WEBHOOK_SECRET>

{
  "source": "n8n",
  "agent_name": "My Agent",
  "org_api_key": "<your org api_key>",
  "intent": "retrieve pending claims for daily triage"
}
```

**Response:**

```json
{
  "data": {
    "agent_id": "<uuid>",
    "decision": "allow",
    "risk_score": 0.2,
    "reason": "No blocking policy matched.",
    "policy_matches": []
  },
  "error": null,
  "status": 200
}
```

**Local dev tunnel (ngrok):**

```powershell
# Terminal 1 — backend
.\backend\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000 --env-file backend/.env

# Terminal 2 — tunnel
ngrok http http://localhost:8000 --host-header=rewrite
```

Update the `BASE_URL` in the n8n `ENV — URL Config` node with the new `https://` URL each time ngrok restarts.

---

## Module Status

| Module     | Status       | Notes                               |
| ---------- | ------------ | ----------------------------------- |
| Auth & DB  | ✅ Complete  | Supabase + Google OAuth             |
| Agents     | ✅ Complete  | CRUD + execute endpoint             |
| Gate       | ✅ Complete  | Policy + risk + anomaly pipeline    |
| Policies   | ✅ Complete  | UI + Supabase direct                |
| Monitoring | ✅ Complete  | Ledger, metrics, anomalies, sources |
| Webhooks   | ✅ Complete  | n8n + Zapier inbound + UI tab       |
| SDK        | ✅ Complete  | GovernHQInterceptor + rate limiting |
| Dashboard  | ✅ Complete  | All tabs wired to real API          |
| Deployment | ⏸️ Pending | Vercel + Railway/Render             |
