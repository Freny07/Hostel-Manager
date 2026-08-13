-- Migration: 20260813040000_issue_affected_students.sql
-- Description: Creates table public.issue_affected_students for tracking students affected by reported issues.

-- 1. Create issue_affected_students Table
CREATE TABLE IF NOT EXISTS public.issue_affected_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_issue_student_affected UNIQUE (issue_id, student_id)
);

-- 2. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_issue_affected_issue_id ON public.issue_affected_students(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_affected_student_id ON public.issue_affected_students(student_id);

-- 3. Row Level Security
ALTER TABLE public.issue_affected_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view affected student records" ON public.issue_affected_students;
CREATE POLICY "Authenticated users can view affected student records"
    ON public.issue_affected_students FOR SELECT
    TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "Students can insert own affected record" ON public.issue_affected_students;
CREATE POLICY "Students can insert own affected record"
    ON public.issue_affected_students FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can delete own affected record" ON public.issue_affected_students;
CREATE POLICY "Students can delete own affected record"
    ON public.issue_affected_students FOR DELETE
    TO authenticated
    USING (student_id = auth.uid());

-- 4. Enable Supabase Realtime
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_affected_students;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
