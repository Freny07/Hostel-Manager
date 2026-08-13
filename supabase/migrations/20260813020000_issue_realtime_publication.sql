-- Migration: 20260813020000_issue_realtime_publication.sql
-- Description: Adds core maintenance issue tables to supabase_realtime publication for instant UI sync.

DO $$
BEGIN
    -- Add public.issues to supabase_realtime publication if not already present
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_assignments;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_updates;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_attachments;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
