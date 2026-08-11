-- Migration: 20260811000001_handle_new_user_trigger.sql
-- Description: Auto-create profile record upon Supabase auth user creation.

-- 1. Ensure default seed roles exist
INSERT INTO public.roles (name, description)
VALUES 
    ('student', 'Default student resident role'),
    ('warden', 'Hostel warden operational role'),
    ('admin', 'Administrator role'),
    ('staff', 'Maintenance & support staff role')
ON CONFLICT (name) DO NOTHING;

-- 2. Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
    extracted_first_name VARCHAR(100);
    extracted_last_name VARCHAR(100);
BEGIN
    -- Fetch the student role ID by default
    SELECT id INTO default_role_id FROM public.roles WHERE name = 'student' LIMIT 1;

    -- Extract names from raw_user_meta_data if present, or use fallbacks
    extracted_first_name := COALESCE(
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        SPLIT_PART(NEW.email, '@', 1)
    );
    
    extracted_last_name := COALESCE(
        NEW.raw_user_meta_data->>'last_name',
        ''
    );

    -- Safely insert profile record
    INSERT INTO public.profiles (
        id,
        role_id,
        first_name,
        last_name,
        email,
        avatar_url,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        default_role_id,
        extracted_first_name,
        extracted_last_name,
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, public.profiles.last_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger binding function to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
