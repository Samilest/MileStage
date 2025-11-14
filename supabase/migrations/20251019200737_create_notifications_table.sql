/*
  # Create notifications table for action tracking

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `stage_id` (uuid, references stages, nullable)
      - `type` (text) - notification type: 'payment_marked', 'revision_requested', 'stage_approved', 'extension_purchased', 'new_message'
      - `message` (text) - human-readable notification message
      - `is_read` (boolean) - whether freelancer has viewed/acknowledged
      - `created_at` (timestamptz)
      - `read_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `notifications` table
    - Add policy for freelancers to read their project notifications
    - Add policy for system to create notifications
    - Add policy for freelancers to update their notifications (mark as read)

  3. Indexes
    - Index on project_id for fast lookup
    - Index on is_read for filtering unread notifications
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  stage_id uuid REFERENCES stages(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Freelancers can view their project notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = notifications.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Freelancers can update their notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = notifications.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = notifications.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_stage_id ON notifications(stage_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);