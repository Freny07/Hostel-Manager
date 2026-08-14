-- Migration: 20260814010000_sla_automatic_escalation.sql
-- Description: Adds escalation tracking columns (is_overdue, is_escalated, sla_breached_at) to public.issues.

-- 1. Add SLA escalation tracking columns to public.issues
ALTER TABLE public.issues
ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sla_breached_at TIMESTAMPTZ;

-- 2. Index for fast background scanner lookups
CREATE INDEX IF NOT EXISTS idx_issues_sla_escalation
ON public.issues (status, is_escalated, sla_deadline);
