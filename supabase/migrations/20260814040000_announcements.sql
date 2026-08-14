-- Migration: 20260814040000_announcements.sql
-- Description: Creates table public.announcements for targeted hostel broadcasts and notifications.

-- 1. Create announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_type VARCHAR(20) NOT NULL DEFAULT 'everyone' CHECK (
        target_type IN ('everyone', 'hostel', 'floor', 'room')
    ),
    target_hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE,
    target_floor_id UUID REFERENCES public.floors(id) ON DELETE CASCADE,
    target_room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    is_published BOOLEAN NOT NULL DEFAULT true,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for efficient lookup & target filtering
CREATE INDEX IF NOT EXISTS idx_announcements_target_type ON public.announcements(target_type);
CREATE INDEX IF NOT EXISTS idx_announcements_hostel ON public.announcements(target_hostel_id);
CREATE INDEX IF NOT EXISTS idx_announcements_floor ON public.announcements(target_floor_id);
CREATE INDEX IF NOT EXISTS idx_announcements_room ON public.announcements(target_room_id);

-- 3. Row Level Security
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant announcements" ON public.announcements;
CREATE POLICY "Users can view relevant announcements"
    ON public.announcements FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'warden', 'staff')
        )
        OR (
            is_published = true
            AND (
                target_type = 'everyone'
                OR (target_type = 'hostel' AND target_hostel_id IS NOT NULL)
                OR (target_type = 'floor' AND target_floor_id IS NOT NULL)
                OR (target_type = 'room' AND target_room_id IS NOT NULL)
            )
        )
    );

DROP POLICY IF EXISTS "Staff can insert announcements" ON public.announcements;
CREATE POLICY "Staff can insert announcements"
    ON public.announcements FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'warden', 'staff')
        )
    );

DROP POLICY IF EXISTS "Staff can update announcements" ON public.announcements;
CREATE POLICY "Staff can update announcements"
    ON public.announcements FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'warden', 'staff')
        )
    );

DROP POLICY IF EXISTS "Staff can delete announcements" ON public.announcements;
CREATE POLICY "Staff can delete announcements"
    ON public.announcements FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'warden', 'staff')
        )
    );
