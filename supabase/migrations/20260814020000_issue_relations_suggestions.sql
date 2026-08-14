-- Migration: 20260814020000_issue_relations_suggestions.sql
-- Description: Creates table public.issue_relations for storing ML-based related issue suggestions & human review decisions.

-- 1. Create issue_relations Table
CREATE TABLE IF NOT EXISTS public.issue_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    target_issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    similarity_score FLOAT NOT NULL,
    relation_type VARCHAR(50) NOT NULL DEFAULT 'suggested_duplicate' CHECK (
        relation_type IN ('suggested_duplicate', 'confirmed_related', 'dismissed')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_issue_relation_pair UNIQUE (source_issue_id, target_issue_id)
);

-- 2. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_issue_relations_source ON public.issue_relations(source_issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_relations_target ON public.issue_relations(target_issue_id);

-- 3. Row Level Security
ALTER TABLE public.issue_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view issue relations" ON public.issue_relations;
CREATE POLICY "Authenticated users can view issue relations"
    ON public.issue_relations FOR SELECT
    TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "Staff can insert or update issue relations" ON public.issue_relations;
CREATE POLICY "Staff can insert or update issue relations"
    ON public.issue_relations FOR ALL
    TO authenticated
    USING (TRUE);
