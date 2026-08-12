-- Migration: 20260812000000_maintenance_issues.sql
-- Description: Database schema for core maintenance issue management system.

-- 1. Issues Table
CREATE TABLE IF NOT EXISTS public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (
        category IN (
            'plumbing',
            'electrical',
            'carpentry',
            'appliance',
            'cleaning',
            'internet',
            'security',
            'pest_control',
            'other'
        )
    ),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (
        priority IN ('low', 'medium', 'high', 'urgent')
    ),
    status VARCHAR(30) NOT NULL DEFAULT 'reported' CHECK (
        status IN (
            'reported',
            'assigned',
            'investigating',
            'repair_scheduled',
            'resolved'
        )
    ),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    location_description TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Issue Comments Table
CREATE TABLE IF NOT EXISTS public.issue_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Issue Updates / Audit History Table
CREATE TABLE IF NOT EXISTS public.issue_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Issue Assignments Table
CREATE TABLE IF NOT EXISTS public.issue_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'reassigned', 'completed', 'cancelled')
    ),
    notes TEXT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Issue Attachments Table
CREATE TABLE IF NOT EXISTS public.issue_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER CHECK (file_size IS NULL OR file_size >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_issues_reporter_id ON public.issues(reporter_id);
CREATE INDEX IF NOT EXISTS idx_issues_hostel_id ON public.issues(hostel_id);
CREATE INDEX IF NOT EXISTS idx_issues_room_id ON public.issues(room_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON public.issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_category ON public.issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON public.issues(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON public.issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_author_id ON public.issue_comments(author_id);

CREATE INDEX IF NOT EXISTS idx_issue_updates_issue_id ON public.issue_updates(issue_id);

CREATE INDEX IF NOT EXISTS idx_issue_assignments_issue_id ON public.issue_assignments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_assignments_assigned_to ON public.issue_assignments(assigned_to);

CREATE INDEX IF NOT EXISTS idx_issue_attachments_issue_id ON public.issue_attachments(issue_id);

-- 7. Automated updated_at Triggers
DROP TRIGGER IF EXISTS trigger_set_updated_at_issues ON public.issues;
CREATE TRIGGER trigger_set_updated_at_issues
BEFORE UPDATE ON public.issues
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_issue_comments ON public.issue_comments;
CREATE TRIGGER trigger_set_updated_at_issue_comments
BEFORE UPDATE ON public.issue_comments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_set_updated_at_issue_assignments ON public.issue_assignments;
CREATE TRIGGER trigger_set_updated_at_issue_assignments
BEFORE UPDATE ON public.issue_assignments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 8. Row Level Security (RLS) Enablement
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Issues
CREATE POLICY "Admins and Wardens have full access to issues"
    ON public.issues FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.name IN ('admin', 'warden')
        )
    );

CREATE POLICY "Students can view their own reported issues"
    ON public.issues FOR SELECT
    TO authenticated
    USING (reporter_id = auth.uid());

CREATE POLICY "Students can report issues"
    ON public.issues FOR INSERT
    TO authenticated
    WITH CHECK (reporter_id = auth.uid());

-- RLS Policies for Comments
CREATE POLICY "Staff can access all comments"
    ON public.issue_comments FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.name IN ('admin', 'warden')
        )
    );

CREATE POLICY "Students can view public comments on own issues"
    ON public.issue_comments FOR SELECT
    TO authenticated
    USING (
        NOT is_internal AND EXISTS (
            SELECT 1 FROM public.issues i
            WHERE i.id = issue_comments.issue_id AND i.reporter_id = auth.uid()
        )
    );

-- RLS Policies for Updates
CREATE POLICY "Authenticated users can view updates for accessible issues"
    ON public.issue_updates FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.issues i
            WHERE i.id = issue_updates.issue_id AND (
                i.reporter_id = auth.uid() OR EXISTS (
                    SELECT 1 FROM public.profiles p
                    JOIN public.roles r ON p.role_id = r.id
                    WHERE p.id = auth.uid() AND r.name IN ('admin', 'warden')
                )
            )
        )
    );

-- RLS Policies for Assignments
CREATE POLICY "Staff can access issue assignments"
    ON public.issue_assignments FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.name IN ('admin', 'warden')
        )
    );

-- RLS Policies for Attachments
CREATE POLICY "Staff can access all issue attachments"
    ON public.issue_attachments FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.name IN ('admin', 'warden')
        )
    );

CREATE POLICY "Students can view attachments on own issues"
    ON public.issue_attachments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.issues i
            WHERE i.id = issue_attachments.issue_id AND i.reporter_id = auth.uid()
        )
    );
