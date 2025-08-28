-- Fix RLS policies with unique names to resolve conflict
DROP POLICY IF EXISTS "Users can view their potential riders" ON public.potential_riders;
DROP POLICY IF EXISTS "Users can update their potential riders" ON public.potential_riders;
DROP POLICY IF EXISTS "Authorized roles can create potential riders" ON public.potential_riders;
DROP POLICY IF EXISTS "Authorized roles can view potential riders" ON public.potential_riders;
DROP POLICY IF EXISTS "Authorized roles can update potential riders" ON public.potential_riders;

-- Create new policies with unique names
CREATE POLICY "View potential riders by creator or admin"
ON public.potential_riders
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by
  OR public.get_current_user_role() = 'admin'
);

CREATE POLICY "Update potential riders by creator or admin"
ON public.potential_riders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  OR public.get_current_user_role() = 'admin'
);

CREATE POLICY "Create potential riders with valid role"
ON public.potential_riders
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_current_user_role() IN ('admin', 'rider_clerk')
  AND auth.uid() = created_by
);