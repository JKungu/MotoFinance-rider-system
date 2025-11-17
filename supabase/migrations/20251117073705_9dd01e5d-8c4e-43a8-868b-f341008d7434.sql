-- Update RLS policies to include rider_clerk role

-- Drop existing policies
DROP POLICY IF EXISTS "Authorized roles can view financed riders" ON financed_riders;
DROP POLICY IF EXISTS "Authorized roles can view payments" ON payments;
DROP POLICY IF EXISTS "Authorized roles can view SMS notifications" ON sms_notifications;
DROP POLICY IF EXISTS "View potential riders by creator or admin" ON potential_riders;

-- Recreate policies with rider_clerk included
CREATE POLICY "Authorized roles can view financed riders"
ON financed_riders
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role) OR 
  has_role(auth.uid(), 'rider_clerk'::app_role)
);

CREATE POLICY "Authorized roles can view payments"
ON payments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role) OR 
  has_role(auth.uid(), 'rider_clerk'::app_role)
);

CREATE POLICY "Authorized roles can view SMS notifications"
ON sms_notifications
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role) OR 
  has_role(auth.uid(), 'rider_clerk'::app_role)
);

CREATE POLICY "View potential riders by creator or admin or rider_clerk"
ON potential_riders
FOR SELECT
TO authenticated
USING (
  auth.uid() = created_by OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'rider_clerk'::app_role)
);