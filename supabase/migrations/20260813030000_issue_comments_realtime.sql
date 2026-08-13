-- Migration: 20260813030000_issue_comments_realtime.sql
-- Description: Adds public.issue_comments to supabase_realtime publication for instant comment syncing.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_comments;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
