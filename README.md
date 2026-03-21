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
AI Agents (n8n / Zapier)
        ↓
   GovernHQ SDK
        ↓
   Gate (FastAPI) ← evaluates intent against policy
        ↓
   Allow / Block / Flag
        ↓
   Dashboard (React) ← manage policies, view logs, monitor agents
```

---

## Module Ownership

| Module     | Owner             | Status         |
| ---------- | ----------------- | -------------- |
| AUTH & DB  | Mfurlan03         | ✅ Complete    |
| GATE       | Mfurlan03         | ✅ Complete  |
| AGENTS     | Sami Malek        | ✅ Complete  |
| MONITORING | Shalini S K       | ✅ Complete   |
| DEPLOYMENT | Didn't define yet | ⏸️ Pending   |

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

## Registering the Agents Router (Backend)

When creating `main.py`, register the agents router and error handler:

```python
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from agents.router import router as agents_router, _AuthError

app = FastAPI()

app.include_router(agents_router)

@app.exception_handler(_AuthError)
async def auth_error_handler(request, exc):
    return JSONResponse(
        {"data": None, "error": exc.detail, "status": exc.status},
        status_code=exc.status,
    )
```

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

| File                    | Required by  | Contains                        |
| ----------------------- | ------------ | ------------------------------- |
| `frontend/.env.local` | Frontend dev | Supabase URL, anon key, API URL |
| `backend/.env`        | Backend dev  | Supabase URL, service role key  |

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
├── supabase/
│   └── migrations/           # SQL migration files

```
