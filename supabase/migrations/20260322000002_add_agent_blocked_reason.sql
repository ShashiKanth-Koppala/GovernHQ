-- Module 2: Monitor Auto-Blocking
-- Adds blocked_reason column so the Monitor can record why an agent was auto-blocked.
-- Also referenced by shield/router.py GET /shield/blocked endpoint.
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS blocked_reason text;
