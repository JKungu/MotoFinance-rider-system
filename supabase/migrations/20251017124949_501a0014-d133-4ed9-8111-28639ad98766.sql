-- ============================================
-- CRITICAL SECURITY FIX: User Roles System
-- ============================================

-- 1. Create app_role enum (if not exists)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'accountant', 'rider_clerk');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create secure user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::text::app_role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Update get_current_user_role to use new table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1
$$;

-- 6. Create RLS policies for user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Only admins can assign/modify roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Everyone can view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- FIX: Financed Riders RLS - Restrict PII Access
-- ============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view financed riders" ON public.financed_riders;
DROP POLICY IF EXISTS "Authenticated users can create financed riders" ON public.financed_riders;
DROP POLICY IF EXISTS "Authenticated users can update financed riders" ON public.financed_riders;

-- Restrict access to admin and accountant roles only
CREATE POLICY "Authorized roles can view financed riders"
ON public.financed_riders FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'accountant')
);

CREATE POLICY "Authorized roles can create financed riders"
ON public.financed_riders FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'accountant')
);

CREATE POLICY "Authorized roles can update financed riders"
ON public.financed_riders FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'accountant')
);

-- ============================================
-- FIX: Payments RLS - Restrict Financial Data
-- ============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can update payments" ON public.payments;

-- Restrict SELECT to admin and accountant
CREATE POLICY "Authorized roles can view payments"
ON public.payments FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'accountant')
);

-- Restrict INSERT to admin and accountant
CREATE POLICY "Authorized roles can create payments"
ON public.payments FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'accountant')
);

-- Restrict UPDATE to admin only (for corrections)
CREATE POLICY "Admins can update payments"
ON public.payments FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- FIX: Profiles Table - Prevent Role Escalation
-- ============================================

-- Drop old update policy that allowed role changes
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policy that prevents role modification
CREATE POLICY "Users can update their own profile except role"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Add comment to profiles.role indicating it's deprecated
COMMENT ON COLUMN public.profiles.role IS 'DEPRECATED: Use user_roles table instead. This column is kept for backward compatibility only and should not be modified by users.';