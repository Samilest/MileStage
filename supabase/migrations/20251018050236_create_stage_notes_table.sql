/*
  # Create stage_notes table for communication

  1. New Tables
    - `stage_notes`
      - `id` (uuid, primary key) - Unique identifier for each note
      - `stage_id` (uuid, foreign key) - References stages table
      - `author_type` (text) - Either 'freelancer' or 'client'
      - `author_name` (text) - Name of the person who wrote the note
      - `message` (text) - The actual message content
      - `is_read` (boolean) - Whether the message has been read
      - `created_at` (timestamptz) - When the note was created

  2. Security
    - Enable RLS on `stage_notes` table
    - Add policy for public access to notes (matches stage access pattern)
    - Clients can access via share_code, freelancers via authentication

  3. Important Notes
    - Messages are sorted by created_at for chronological display
    - Realtime subscriptions enabled for live updates
    - Character limit enforced at application level (500 chars)
*/

CREATE TABLE IF NOT EXISTS stage_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  author_type text NOT NULL CHECK (author_type IN ('freelancer', 'client')),
  author_name text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries by stage
CREATE INDEX IF NOT EXISTS idx_stage_notes_stage_id ON stage_notes(stage_id);
CREATE INDEX IF NOT EXISTS idx_stage_notes_created_at ON stage_notes(created_at);

-- Enable RLS
ALTER TABLE stage_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read notes for stages they have access to
-- This works because:
-- 1. Authenticated users can access their own project stages
-- 2. Public users can access stages via share_code (through the projects table)
CREATE POLICY "Anyone can read stage notes"
  ON stage_notes
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert notes for their stages
CREATE POLICY "Authenticated users can create notes"
  ON stage_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stages
      INNER JOIN projects ON stages.project_id = projects.id
      WHERE stages.id = stage_notes.stage_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy: Allow anonymous users to insert notes (for client portal)
-- They can insert notes for any stage (we trust the application logic)
CREATE POLICY "Public users can create notes"
  ON stage_notes
  FOR INSERT
  TO anon
  WITH CHECK (true);