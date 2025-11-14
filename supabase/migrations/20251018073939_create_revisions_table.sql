/*
  # Create Revisions Table
  
  1. New Table: revisions
    - `id` (UUID, primary key) - Unique identifier
    - `stage_id` (UUID, foreign key) - References stages table
    - `feedback` (TEXT NOT NULL) - Client's revision request details
    - `requested_at` (TIMESTAMPTZ DEFAULT now()) - When revision was requested
    - `created_at` (TIMESTAMPTZ DEFAULT now()) - Record creation timestamp
  
  2. Security
    - Enable RLS on revisions table
    - Policy: Project owner can read all revisions for their projects
    - Policy: Client can read revisions for projects they have share_code access to
    - Policy: Client can insert revisions for accessible projects
  
  3. Purpose
    - Track revision request history
    - Store client feedback for each revision
    - Enable audit trail of change requests
*/

CREATE TABLE IF NOT EXISTS revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  feedback TEXT NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project owner can read revisions"
  ON revisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stages s
      JOIN projects p ON s.project_id = p.id
      WHERE s.id = revisions.stage_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Client can read revisions via share code"
  ON revisions FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM stages s
      JOIN projects p ON s.project_id = p.id
      WHERE s.id = revisions.stage_id
      AND p.share_code IS NOT NULL
    )
  );

CREATE POLICY "Client can insert revisions"
  ON revisions FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stages s
      JOIN projects p ON s.project_id = p.id
      WHERE s.id = revisions.stage_id
      AND p.share_code IS NOT NULL
      AND s.status = 'delivered'
    )
  );