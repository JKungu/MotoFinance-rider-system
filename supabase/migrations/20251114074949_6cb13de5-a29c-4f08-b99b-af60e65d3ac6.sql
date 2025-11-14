-- Fix bikes table access control - restrict management to admins and accountants

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can manage bikes" ON bikes;
DROP POLICY IF EXISTS "Authenticated users can view bikes" ON bikes;

-- Allow admins and accountants to manage bikes (all operations)
CREATE POLICY "Admins and accountants can manage bikes"
ON bikes FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- Allow all authenticated users to view bikes (read-only)
CREATE POLICY "All users can view bikes"
ON bikes FOR SELECT
TO authenticated
USING (true);