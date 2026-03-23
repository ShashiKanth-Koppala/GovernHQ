-- Module 1: Agent Intelligence
-- Adds verified flag to agents for identity verification badge
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;
