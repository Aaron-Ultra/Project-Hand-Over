-- ============================================================================
-- Migration: Update Profiles Table, RLS Policies, and Audit Logging
-- File: supabase/migrations/20261005000000_update_profiles_rls_audit.sql
-- Description:
--   1. Adds missing profile fields (phone, hostel, block, floor, room_number, course, year, 
--      guardian_name, guardian_phone, status, must_change_password, created_by, roll_number).
--   2. Enforces unique constraints on email and roll_number.
--   3. Configures Row Level Security (RLS) for Students, Wardens, and Admins.
--   4. Creates audit_log table & trigger to record every student creation event.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. ADD MISSING COLUMNS TO PROFILES TABLE
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hostel TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS block TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS floor TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS guardian_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ----------------------------------------------------------------------------
-- 2. UNIQUE CONSTRAINTS (EMAIL AND ROLL_NUMBER)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_email_key'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_roll_number_key'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_roll_number_key UNIQUE (roll_number);
    END IF;
END $$;

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_profiles_hostel ON public.profiles(hostel);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_roll_number ON public.profiles(roll_number);

-- ----------------------------------------------------------------------------
-- 3. AUDIT LOG TABLE & STUDENT CREATION TRIGGER
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log view policies (Admins can view all logs, users view own)
DROP POLICY IF EXISTS "Admins read all audit logs" ON public.audit_log;
CREATE POLICY "Admins read all audit logs" ON public.audit_log
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users read own audit logs" ON public.audit_log;
CREATE POLICY "Users read own audit logs" ON public.audit_log
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Function & Trigger to automatically log student creations
CREATE OR REPLACE FUNCTION public.fn_log_student_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role = 'student' THEN
        INSERT INTO public.audit_log (user_id, role, action, details)
        VALUES (
            NEW.id,
            NEW.role,
            'student_created',
            jsonb_build_object(
                'email', NEW.email,
                'full_name', NEW.full_name,
                'roll_number', NEW.roll_number,
                'hostel', NEW.hostel,
                'block', NEW.block,
                'created_by', NEW.created_by
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_student_created ON public.profiles;
CREATE TRIGGER trg_log_student_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_log_student_created();

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES FOR PROFILES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper functions for cleaner policy evaluation
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_hostel()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT hostel FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Trigger to prevent students from updating restricted columns (role, status, hostel)
CREATE OR REPLACE FUNCTION public.fn_protect_profile_restricted_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If updater is student (or updating own profile as student), restrict role, status, hostel edits
    IF public.current_user_role() = 'student' THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Students are not allowed to change their role';
        END IF;
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Students are not allowed to change their status';
        END IF;
        IF NEW.hostel IS DISTINCT FROM OLD.hostel THEN
            RAISE EXCEPTION 'Students are not allowed to change their hostel assignment';
        END IF;
    END IF;

    -- Non-admins cannot elevate or create non-student roles (warden, office, admin)
    IF public.current_user_role() <> 'admin' THEN
        IF NEW.role IN ('warden', 'office', 'admin') AND (OLD.role IS NULL OR OLD.role <> NEW.role) THEN
            RAISE EXCEPTION 'Only administrators can create or assign warden, office, or admin roles';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_restricted_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_restricted_fields
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_protect_profile_restricted_fields();

-- Clean up existing profile policies
DROP POLICY IF EXISTS "read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Students read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Students update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Wardens read students in hostel" ON public.profiles;
DROP POLICY IF EXISTS "Wardens insert students" ON public.profiles;
DROP POLICY IF EXISTS "Admins full management" ON public.profiles;

-- POLICY A: Students can read their own profile
CREATE POLICY "Students read own profile"
    ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- POLICY B: Students can update their own profile
CREATE POLICY "Students update own profile"
    ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- POLICY C: Wardens can read profiles of students in their hostel (and their own profile)
CREATE POLICY "Wardens read students in hostel"
    ON public.profiles
    FOR SELECT TO authenticated
    USING (
        public.current_user_role() = 'warden' AND (
            id = auth.uid() OR (
                role = 'student' AND hostel = public.current_user_hostel()
            )
        )
    );

-- POLICY D: Wardens can insert ONLY student profiles
CREATE POLICY "Wardens insert students"
    ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (
        public.current_user_role() = 'warden' AND role = 'student'
    );

-- POLICY E: Admins have full access to select, insert, update, and delete all profiles
CREATE POLICY "Admins full management"
    ON public.profiles
    FOR ALL TO authenticated
    USING (public.current_user_role() = 'admin')
    WITH CHECK (public.current_user_role() = 'admin');

COMMIT;
