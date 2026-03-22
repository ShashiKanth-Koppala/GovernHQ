-- Migration 000004 — add metadata jsonb column to organizations
-- Used by GET /settings and PATCH /settings to persist per-org governance
-- settings (risk_threshold, anomaly_sensitivity, enforcement_mode, fail_mode).
--
-- Apply in Supabase dashboard → SQL Editor → paste + Run.

alter table organizations
  add column if not exists metadata jsonb default '{}'::jsonb;
