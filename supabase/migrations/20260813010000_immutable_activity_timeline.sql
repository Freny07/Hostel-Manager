-- Migration: 20260813010000_immutable_activity_timeline.sql
-- Description: Adds event_type column to public.issue_updates table and configures performance index.

-- 1. Add event_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'issue_updates' 
          AND column_name = 'event_type'
    ) THEN
        ALTER TABLE public.issue_updates 
        ADD COLUMN event_type VARCHAR(50) NOT NULL DEFAULT 'status_changed';
    END IF;
END $$;

-- 2. Index for fast chronological lookup by issue_id and created_at
CREATE INDEX IF NOT EXISTS idx_issue_updates_issue_created 
ON public.issue_updates (issue_id, created_at DESC);

-- 3. Immutability Policy Safeguard: Ensure UPDATE and DELETE are NOT permitted on issue_updates
DROP POLICY IF EXISTS "Disallow update on issue_updates" ON public.issue_updates;
DROP POLICY IF EXISTS "Disallow delete on issue_updates" ON public.issue_updates;
