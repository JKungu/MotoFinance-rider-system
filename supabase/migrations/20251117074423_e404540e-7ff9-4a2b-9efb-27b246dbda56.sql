-- Fix infinite recursion in business_expenses and journal_entries RLS policies
-- by using the has_role security definer function instead of querying profiles directly

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins and accountants can manage expenses" ON business_expenses;
DROP POLICY IF EXISTS "Admins and accountants can manage journal entries" ON journal_entries;

-- Recreate policies using has_role function (security definer, bypasses RLS)
CREATE POLICY "Admins and accountants can manage expenses"
ON business_expenses
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role)
);

CREATE POLICY "Admins and accountants can manage journal entries"
ON journal_entries
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role)
);