-- Allow SMS notifications table to be updated (currently missing UPDATE policy)
CREATE POLICY "Authenticated users can update SMS notifications"
ON public.sms_notifications
FOR UPDATE
TO authenticated
USING (true);