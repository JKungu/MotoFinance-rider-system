-- Restrict SMS notifications access to admins and accountants only

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view SMS notifications" ON sms_notifications;
DROP POLICY IF EXISTS "Authenticated users can create SMS notifications" ON sms_notifications;
DROP POLICY IF EXISTS "Authenticated users can update SMS notifications" ON sms_notifications;

-- Only admins and accountants can view SMS notifications
CREATE POLICY "Authorized roles can view SMS notifications"
ON sms_notifications FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- Only admins and accountants can create SMS notifications
CREATE POLICY "Authorized roles can create SMS notifications"
ON sms_notifications FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role));

-- Only admins can update SMS notifications (for status updates)
CREATE POLICY "Admins can update SMS notifications"
ON sms_notifications FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));