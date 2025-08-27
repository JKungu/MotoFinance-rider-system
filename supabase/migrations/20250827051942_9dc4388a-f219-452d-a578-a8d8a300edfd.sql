-- Create security definer function to safely check user roles without RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop the overly permissive policy that allows all users to see potential rider data
DROP POLICY IF EXISTS "Authenticated users can view potential riders" ON public.potential_riders;

-- Create role-based policy for viewing potential riders
-- Only admins and rider clerks should access sensitive customer personal data
CREATE POLICY "Authorized roles can view potential riders"
ON public.potential_riders
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() IN ('admin', 'rider_clerk')
  OR auth.uid() = created_by
);

-- Update the update policy to also be role-based
DROP POLICY IF EXISTS "Authenticated users can update potential riders" ON public.potential_riders;

CREATE POLICY "Authorized roles can update potential riders"
ON public.potential_riders
FOR UPDATE
TO authenticated
USING (
  public.get_current_user_role() IN ('admin', 'rider_clerk')
  OR auth.uid() = created_by
);

-- Update the insert policy to maintain the created_by check
DROP POLICY IF EXISTS "Authenticated users can create potential riders" ON public.potential_riders;

CREATE POLICY "Authorized roles can create potential riders"
ON public.potential_riders
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_current_user_role() IN ('admin', 'rider_clerk')
  AND auth.uid() = created_by
);