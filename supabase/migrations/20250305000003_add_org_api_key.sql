-- Migration 000003: add api_key to organizations
-- Idempotent — safe to run multiple times.

alter table organizations
  add column if not exists api_key text unique;
