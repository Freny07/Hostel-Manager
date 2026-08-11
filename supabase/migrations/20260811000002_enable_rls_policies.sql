-- Migration: 20260811000002_enable_rls_policies.sql
-- Description: PostgreSQL Row Level Security (RLS) policies for foundational tables.

-- 1. Helper function to safely fetch auth.uid()'s role without infinite RLS recursion
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS VARCHAR AS $$
DECLARE
  user_role VARCHAR;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT LOWER(r.name) INTO user_role
  FROM public.profiles p
  JOIN public.roles r ON p.role_id = r.id
  WHERE p.id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(user_role, 'student');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Enable Row Level Security on all foundational tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_allocations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. POLICIES FOR: public.roles
-- ============================================================================
DROP POLICY IF EXISTS "Roles select policy" ON public.roles;
CREATE POLICY "Roles select policy" ON public.roles
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Roles admin insert policy" ON public.roles;
CREATE POLICY "Roles admin insert policy" ON public.roles
    FOR INSERT TO authenticated
    WITH CHECK (public.get_auth_role() = 'admin');

DROP POLICY IF EXISTS "Roles admin update policy" ON public.roles;
CREATE POLICY "Roles admin update policy" ON public.roles
    FOR UPDATE TO authenticated
    USING (public.get_auth_role() = 'admin')
    WITH CHECK (public.get_auth_role() = 'admin');

DROP POLICY IF EXISTS "Roles admin delete policy" ON public.roles;
CREATE POLICY "Roles admin delete policy" ON public.roles
    FOR DELETE TO authenticated
    USING (public.get_auth_role() = 'admin');

-- ============================================================================
-- 4. POLICIES FOR: public.profiles
-- ============================================================================
-- SELECT: Users read own profile OR wardens/admins read all profiles
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
CREATE POLICY "Profiles select policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid() 
        OR public.get_auth_role() IN ('admin', 'warden')
    );

-- INSERT: Self registration OR admin
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (
        id = auth.uid() 
        OR public.get_auth_role() = 'admin'
    );

-- UPDATE: Self update (role_id remains unchanged) OR admin update
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        id = auth.uid() 
        OR public.get_auth_role() = 'admin'
    )
    WITH CHECK (
        (id = auth.uid() AND role_id IS NOT DISTINCT FROM (SELECT p.role_id FROM public.profiles p WHERE p.id = auth.uid()))
        OR public.get_auth_role() = 'admin'
    );

-- DELETE: Admin only
DROP POLICY IF EXISTS "Profiles delete policy" ON public.profiles;
CREATE POLICY "Profiles delete policy" ON public.profiles
    FOR DELETE TO authenticated
    USING (public.get_auth_role() = 'admin');

-- ============================================================================
-- 5. POLICIES FOR: public.hostels, public.floors, public.rooms, public.beds
-- ============================================================================
-- Hostels
DROP POLICY IF EXISTS "Hostels select policy" ON public.hostels;
CREATE POLICY "Hostels select policy" ON public.hostels
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Hostels manage policy" ON public.hostels;
CREATE POLICY "Hostels manage policy" ON public.hostels
    FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('admin', 'warden'))
    WITH CHECK (public.get_auth_role() IN ('admin', 'warden'));

-- Floors
DROP POLICY IF EXISTS "Floors select policy" ON public.floors;
CREATE POLICY "Floors select policy" ON public.floors
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Floors manage policy" ON public.floors;
CREATE POLICY "Floors manage policy" ON public.floors
    FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('admin', 'warden'))
    WITH CHECK (public.get_auth_role() IN ('admin', 'warden'));

-- Rooms
DROP POLICY IF EXISTS "Rooms select policy" ON public.rooms;
CREATE POLICY "Rooms select policy" ON public.rooms
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Rooms manage policy" ON public.rooms;
CREATE POLICY "Rooms manage policy" ON public.rooms
    FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('admin', 'warden'))
    WITH CHECK (public.get_auth_role() IN ('admin', 'warden'));

-- Beds
DROP POLICY IF EXISTS "Beds select policy" ON public.beds;
CREATE POLICY "Beds select policy" ON public.beds
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Beds manage policy" ON public.beds;
CREATE POLICY "Beds manage policy" ON public.beds
    FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('admin', 'warden'))
    WITH CHECK (public.get_auth_role() IN ('admin', 'warden'));

-- ============================================================================
-- 6. POLICIES FOR: public.room_allocations
-- ============================================================================
-- SELECT: Students view own allocation OR wardens/admins view all allocations
DROP POLICY IF EXISTS "Allocations select policy" ON public.room_allocations;
CREATE POLICY "Allocations select policy" ON public.room_allocations
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid() 
        OR public.get_auth_role() IN ('admin', 'warden')
    );

-- MANAGE (INSERT/UPDATE/DELETE): Wardens and Admins
DROP POLICY IF EXISTS "Allocations manage policy" ON public.room_allocations;
CREATE POLICY "Allocations manage policy" ON public.room_allocations
    FOR ALL TO authenticated
    USING (public.get_auth_role() IN ('admin', 'warden'))
    WITH CHECK (public.get_auth_role() IN ('admin', 'warden'));
