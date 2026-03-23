-- Migration 000007: Backfill prev_hash for all existing ledger_events rows.
--
-- Purpose: rows inserted before migration 000006 have prev_hash = null.
-- This migration walks all rows per org ordered by created_at ASC and
-- assigns a valid prev_hash so the entire ledger forms a verifiable chain.
--
-- Hash formula matches Python's hash_row() in backend/core/ledger_chain.py:
--   SHA-256( id|agent_id|action|status|created_at_iso|prev_hash )
-- where created_at_iso is ISO 8601 format (YYYY-MM-DD"T"HH24:MI:SS.USOF)
-- matching the string Supabase/PostgREST returns to the Python client.
--
-- IMPORTANT: Apply this in Supabase SQL Editor AFTER migration 000006.
-- After applying, re-run GET /monitoring/chain-integrity to see all rows
-- verified. If chain still shows broken_at, check that the created_at
-- timestamp format matches exactly what the Supabase client returns.
--
-- Requires: pgcrypto extension (available by default in Supabase).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    org_rec    RECORD;
    row_rec    RECORD;
    prev_h     TEXT;
    genesis    TEXT;
    hash_input TEXT;
    ts_str     TEXT;
BEGIN
    genesis := encode(digest('genesis', 'sha256'), 'hex');

    -- Process each org's rows independently
    FOR org_rec IN
        SELECT DISTINCT organization_id FROM public.ledger_events
    LOOP
        prev_h := NULL;

        -- Walk this org's rows oldest-first
        FOR row_rec IN
            SELECT id, agent_id, action, status, created_at
            FROM public.ledger_events
            WHERE organization_id = org_rec.organization_id
            ORDER BY created_at ASC, id ASC
        LOOP
            -- First row in org anchors to genesis; subsequent rows link to prior
            IF prev_h IS NULL THEN
                prev_h := genesis;
            END IF;

            -- Set this row's prev_hash
            UPDATE public.ledger_events
            SET prev_hash = prev_h
            WHERE id = row_rec.id;

            -- Compute hash of this row (becomes prev_hash for the next row).
            -- Format: pipe-separated fields matching Python's hash_row().
            -- created_at: ISO 8601 with T separator, microseconds, UTC offset.
            ts_str := to_char(row_rec.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.USOF');

            hash_input := coalesce(row_rec.id::text, '')
                || '|' || coalesce(row_rec.agent_id::text, '')
                || '|' || coalesce(row_rec.action, '')
                || '|' || coalesce(row_rec.status, '')
                || '|' || ts_str
                || '|' || prev_h;

            prev_h := encode(digest(hash_input, 'sha256'), 'hex');
        END LOOP;
    END LOOP;
END $$;
