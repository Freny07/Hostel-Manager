-- Migration: 20260814050000_audit_logs.sql
-- Description: Creates append-only public.audit_logs table for administrative and security action logging.

-- 1. Create audit_logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast filtering & temporal queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 3. Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ONLY admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Authenticated users can insert audit logs via server actions
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (actor_id = auth.uid());

-- NO UPDATE or DELETE policies -> immutable append-only audit trail
