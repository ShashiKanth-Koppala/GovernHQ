-- Module 5 (Day 3): Agent Scope Enforcement
-- Adds scope jsonb to agents. Empty object ({}) = unrestricted.
-- Shape: { databases: string[], apis: string[], pii_level: "none"|"masked"|"full",
--          max_rows: int, external_calls: bool }
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS scope jsonb DEFAULT '{}'::jsonb;
