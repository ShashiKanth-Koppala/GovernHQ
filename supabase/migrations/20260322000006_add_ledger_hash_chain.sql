-- Migration 000006 — add hash chain + action_type to ledger_events
--
-- prev_hash:   SHA-256 of the previous row's content fields.
--              First row in a chain links to SHA-256("genesis").
--              NULL on rows written before this migration.
-- action_type: Classified action category (DB_QUERY, DB_WRITE, API_CALL,
--              FILE_IO, NOTIFICATION, AGENT_ACTION).
--              NULL on rows written before this migration.
--
-- Apply in Supabase dashboard → SQL Editor → paste + Run.

alter table ledger_events
  add column if not exists prev_hash   text,
  add column if not exists action_type text;
