-- Add INSERT policy for notifications table.
-- Previous migration defined SELECT/UPDATE/DELETE but omitted INSERT,
-- causing all notification writes to fail silently.
-- Authenticated users may insert notifications for any recipient
-- (connection requests, accepted connections, project applications, etc.).
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
