-- Migration: 20260814000000_sla_tracking.sql
-- Description: Adds sla_deadline column, SLA calculation function, and auto-update trigger.

-- 1. Add sla_deadline column to public.issues
ALTER TABLE public.issues
ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ;

-- 2. Function to compute SLA deadline based on creation time & priority
CREATE OR REPLACE FUNCTION calculate_issue_sla_deadline(p_created_at TIMESTAMPTZ, p_priority VARCHAR(20))
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN CASE LOWER(COALESCE(p_priority, 'medium'))
        WHEN 'urgent' THEN p_created_at + INTERVAL '30 minutes'
        WHEN 'critical' THEN p_created_at + INTERVAL '30 minutes'
        WHEN 'high' THEN p_created_at + INTERVAL '2 hours'
        WHEN 'medium' THEN p_created_at + INTERVAL '24 hours'
        WHEN 'low' THEN p_created_at + INTERVAL '72 hours'
        ELSE p_created_at + INTERVAL '24 hours'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Trigger function to set sla_deadline on INSERT or priority UPDATE
CREATE OR REPLACE FUNCTION set_issue_sla_deadline_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sla_deadline IS NULL OR (TG_OP = 'UPDATE' AND NEW.priority IS DISTINCT FROM OLD.priority) THEN
        NEW.sla_deadline := calculate_issue_sla_deadline(NEW.created_at, NEW.priority);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach Trigger
DROP TRIGGER IF EXISTS trg_set_issue_sla_deadline ON public.issues;
CREATE TRIGGER trg_set_issue_sla_deadline
    BEFORE INSERT OR UPDATE OF priority ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION set_issue_sla_deadline_trigger();

-- 5. Backfill existing issues with accurate SLA deadlines
UPDATE public.issues
SET sla_deadline = calculate_issue_sla_deadline(created_at, priority)
WHERE sla_deadline IS NULL;
