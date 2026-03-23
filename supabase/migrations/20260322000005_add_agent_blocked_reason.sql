-- Migration 000005 — add blocked_reason column to agents
-- Used by Shield router: GET /shield/blocked, POST /shield/agents/{id}/allow,
-- and POST /shield/block-all to store why an agent was blocked and by whom.
--
-- blocked_reason: human-readable description (e.g., "Anomaly threshold exceeded")
-- blocked_by / blocked_at are stored in agents.metadata jsonb to avoid extra columns.
--
-- Apply in Supabase dashboard → SQL Editor → paste + Run.

alter table agents
  add column if not exists blocked_reason text;
