-- Fix RLS policy for potential_riders table to allow users to insert their own records
DROP POLICY IF EXISTS "Authenticated users can create potential riders" ON public.potential_riders;

CREATE POLICY "Authenticated users can create potential riders"
ON public.potential_riders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Also update the policy to ensure created_by is properly set
ALTER TABLE public.potential_riders 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Make sure created_by is not nullable to prevent RLS issues
ALTER TABLE public.potential_riders 
ALTER COLUMN created_by SET NOT NULL;