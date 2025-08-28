-- Fix the RLS policy issue by ensuring new users can access the system
-- The issue is that new signups get 'rider_clerk' role by default but RLS was blocking them

-- First, let's check the current state and fix the potential_riders policies
-- Drop the overly restrictive policies and create more appropriate ones

DROP POLICY IF EXISTS "Authorized roles can view potential riders" ON public.potential_riders;
DROP POLICY IF EXISTS "Authorized roles can update potential riders" ON public.potential_riders;
DROP POLICY IF EXISTS "Authorized roles can create potential riders" ON public.potential_riders;

-- Create new policies that work with the default role assignment
-- Allow rider_clerk (default role) and admin to create potential riders
CREATE POLICY "Authorized roles can create potential riders"
ON public.potential_riders
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_current_user_role() IN ('admin', 'rider_clerk')
  AND auth.uid() = created_by
);

-- Allow users to view potential riders they created, plus allow admins to see all
CREATE POLICY "Users can view their potential riders"
ON public.potential_riders
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by
  OR public.get_current_user_role() = 'admin'
);

-- Allow users to update potential riders they created, plus allow admins to update all
CREATE POLICY "Users can update their potential riders"
ON public.potential_riders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  OR public.get_current_user_role() = 'admin'
);