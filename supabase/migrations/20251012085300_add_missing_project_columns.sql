/*
  # Add Missing Columns to Projects Table

  1. New Columns
    - `client_email` (text) - Client email address for notifications
    - `project_name` (text) - Alternative project name (defaults to client_name)
    - `share_code` (text, unique, indexed) - Public share code for client portal access
    - `template_used` (text) - Template ID used for project creation
    - `payment_methods` (jsonb) - Array of accepted payment methods
  
  2. Changes
    - Add unique constraint on share_code
    - Add index on share_code for faster lookups
    - Set default values where appropriate
*/

-- Add new columns to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'client_email'
  ) THEN
    ALTER TABLE projects ADD COLUMN client_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'project_name'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'share_code'
  ) THEN
    ALTER TABLE projects ADD COLUMN share_code text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'template_used'
  ) THEN
    ALTER TABLE projects ADD COLUMN template_used text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'payment_methods'
  ) THEN
    ALTER TABLE projects ADD COLUMN payment_methods jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create index on share_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_share_code ON projects(share_code);
