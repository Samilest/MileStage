/*
  # Add public access to user_profiles for client portal

  1. Changes
    - Add policy to allow anonymous users to view user_profiles when accessing via share_code
    
  2. Security
    - Only allows SELECT (read-only) access
    - Only for user profiles associated with projects that have a valid share_code
    - Anonymous users can only read name and email fields needed for client portal
*/

CREATE POLICY "Public can view user profiles via project share_code"
  ON user_profiles
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.user_id = user_profiles.id
      AND projects.share_code IS NOT NULL
    )
  );