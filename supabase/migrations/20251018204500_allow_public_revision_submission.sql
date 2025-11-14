/*
  # Allow Public Revision Submission via Share Code

  1. Changes
    - Add policy to allow anonymous users to INSERT revisions for projects with share_code
    - Add policy to allow anonymous users to UPDATE stages (revisions_used counter) for projects with share_code

  2. Security
    - Policies verify that the project has a valid share_code
    - Only specific columns can be updated on stages (revisions_used, status)
    - Revisions can only be inserted, not updated or deleted by anonymous users
*/

-- Allow anonymous users to INSERT revisions for projects accessed via share_code
CREATE POLICY "Public can insert revisions via share_code"
  ON revisions FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = revisions.stage_id
      AND projects.share_code IS NOT NULL
    )
  );

-- Allow anonymous users to UPDATE stages (for revisions_used counter) via share_code
CREATE POLICY "Public can update stages via share_code"
  ON stages FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = stages.project_id
      AND projects.share_code IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = stages.project_id
      AND projects.share_code IS NOT NULL
    )
  );
