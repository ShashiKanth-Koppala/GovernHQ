# Task: FastAPI Agent CRUD Endpoints

## Context
- Backend: FastAPI (separate from frontend)
- DB: Supabase Postgres, agents table is live
- Auth: Supabase JWT tokens — extract org from token

## Endpoints to build
GET    /agents          → list agents for caller's org
POST   /agents          → create agent (name, source, metadata, risk_profile)
PATCH  /agents/{id}     → update agent
DELETE /agents/{id}     → delete agent

## Rules
- All endpoints require valid Supabase JWT
- Filter by organization_id extracted from JWT — never trust client-supplied org_id
- Follow exact pattern of existing Gate endpoints
- Return consistent JSON: {data, error, status}