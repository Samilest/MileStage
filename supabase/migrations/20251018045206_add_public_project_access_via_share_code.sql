/*
  # Add public access to projects via share_code

  1. Changes
    - Add policy to allow anonymous users to view projects using share_code
    
  2. Security
    - Only allows SELECT (read-only) access
    - Only for projects with a valid share_code (NOT NULL)
    - Anonymous users can only read, not modify
*/

CREATE POLICY "Public can view projects via share_code"
  ON projects
  FOR SELECT
  TO anon
  USING (share_code IS NOT NULL);