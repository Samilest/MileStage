/*
  # Create Stages and Related Tables

  1. New Tables
    - `stages`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `stage_number` (integer) - Sequential stage number
      - `name` (text) - Stage name
      - `amount` (numeric) - Stage payment amount
      - `status` (text) - locked, active, review, completed, cancelled
      - `revisions_included` (integer) - Number of revisions included
      - `revisions_used` (integer) - Number of revisions used
      - `extension_enabled` (boolean) - Whether extension is available
      - `extension_price` (numeric) - Price for extension
      - `extension_purchased` (boolean) - Whether extension was purchased
      - `payment_status` (text) - unpaid, pending, paid
      - `payment_received_at` (timestamptz) - When payment was received
      - `reference_code` (text) - Unique reference code for this stage
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `deliverables`
      - `id` (uuid, primary key)
      - `stage_id` (uuid, foreign key to stages)
      - `name` (text) - Deliverable name
      - `file_url` (text) - URL to the file
      - `uploaded_at` (timestamptz)
    
    - `revisions`
      - `id` (uuid, primary key)
      - `stage_id` (uuid, foreign key to stages)
      - `revision_number` (integer) - Sequential revision number
      - `feedback` (text) - Client feedback
      - `status` (text) - pending, in_progress, completed
      - `created_at` (timestamptz)
    
    - `extensions`
      - `id` (uuid, primary key)
      - `stage_id` (uuid, foreign key to stages)
      - `purchased_at` (timestamptz)
      - `additional_revisions` (integer) - Number of additional revisions granted

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access via share_code for client portal
*/

-- Create stages table
CREATE TABLE IF NOT EXISTS stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_number integer NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'locked',
  revisions_included integer DEFAULT 2,
  revisions_used integer DEFAULT 0,
  extension_enabled boolean DEFAULT false,
  extension_price numeric DEFAULT 0,
  extension_purchased boolean DEFAULT false,
  payment_status text DEFAULT 'unpaid',
  payment_received_at timestamptz,
  reference_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create deliverables table
CREATE TABLE IF NOT EXISTS deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Create revisions table
CREATE TABLE IF NOT EXISTS revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  revision_number integer NOT NULL,
  feedback text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Create extensions table
CREATE TABLE IF NOT EXISTS extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  purchased_at timestamptz DEFAULT now(),
  additional_revisions integer DEFAULT 1
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stages_project_id ON stages(project_id);
CREATE INDEX IF NOT EXISTS idx_stages_stage_number ON stages(project_id, stage_number);
CREATE INDEX IF NOT EXISTS idx_deliverables_stage_id ON deliverables(stage_id);
CREATE INDEX IF NOT EXISTS idx_revisions_stage_id ON revisions(stage_id);
CREATE INDEX IF NOT EXISTS idx_extensions_stage_id ON extensions(stage_id);

-- Enable RLS
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE extensions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stages
CREATE POLICY "Users can view own project stages"
  ON stages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = stages.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own project stages"
  ON stages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = stages.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project stages"
  ON stages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = stages.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = stages.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own project stages"
  ON stages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = stages.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Public read access for client portal (via share_code)
CREATE POLICY "Public can view stages via share_code"
  ON stages FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = stages.project_id
      AND projects.share_code IS NOT NULL
    )
  );

-- RLS Policies for deliverables
CREATE POLICY "Users can view own stage deliverables"
  ON deliverables FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = deliverables.stage_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own stage deliverables"
  ON deliverables FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = deliverables.stage_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own stage deliverables"
  ON deliverables FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = deliverables.stage_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = deliverables.stage_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own stage deliverables"
  ON deliverables FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = deliverables.stage_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view deliverables via share_code"
  ON deliverables FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = deliverables.stage_id
      AND projects.share_code IS NOT NULL
    )
  );

-- RLS Policies for revisions
CREATE POLICY "Users can view own stage revisions"
  ON revisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = revisions.stage_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own stage revisions"
  ON revisions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = revisions.stage_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own stage revisions"
  ON revisions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = revisions.stage_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = revisions.stage_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own stage revisions"
  ON revisions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = revisions.stage_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view revisions via share_code"
  ON revisions FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = revisions.stage_id
      AND projects.share_code IS NOT NULL
    )
  );

-- RLS Policies for extensions
CREATE POLICY "Users can view own stage extensions"
  ON extensions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = extensions.stage_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own stage extensions"
  ON extensions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = extensions.stage_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own stage extensions"
  ON extensions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = extensions.stage_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = extensions.stage_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own stage extensions"
  ON extensions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = extensions.stage_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view extensions via share_code"
  ON extensions FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM stages
      JOIN projects ON projects.id = stages.project_id
      WHERE stages.id = extensions.stage_id
      AND projects.share_code IS NOT NULL
    )
  );
