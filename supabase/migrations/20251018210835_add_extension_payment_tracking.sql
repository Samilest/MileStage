/*
  # Add Extension Payment Tracking Fields

  1. Updates
    - Add payment tracking fields to extensions table:
      - amount (numeric) - Extension price
      - reference_code (text) - Unique payment reference code  
      - status (text) - marked_paid, verified, rejected
      - marked_paid_at (timestamp) - When client marked payment sent
      - verified_at (timestamp) - When freelancer verified payment
      - rejected_at (timestamp) - If payment wasn't received

  2. Security
    - Allows public insert access (client can mark payment sent)
    - Allows authenticated read access (freelancer can see pending extensions)
    - Allows authenticated update access (freelancer can verify/reject)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'extensions' AND column_name = 'amount'
  ) THEN
    ALTER TABLE extensions ADD COLUMN amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'extensions' AND column_name = 'reference_code'
  ) THEN
    ALTER TABLE extensions ADD COLUMN reference_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'extensions' AND column_name = 'status'
  ) THEN
    ALTER TABLE extensions ADD COLUMN status text DEFAULT 'marked_paid';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'extensions' AND column_name = 'marked_paid_at'
  ) THEN
    ALTER TABLE extensions ADD COLUMN marked_paid_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'extensions' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE extensions ADD COLUMN verified_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'extensions' AND column_name = 'rejected_at'
  ) THEN
    ALTER TABLE extensions ADD COLUMN rejected_at timestamptz;
  END IF;
END $$;

DROP POLICY IF EXISTS "Anyone can insert extensions" ON extensions;
CREATE POLICY "Anyone can insert extensions"
  ON extensions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read extensions" ON extensions;
CREATE POLICY "Authenticated users can read extensions"
  ON extensions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can update extensions" ON extensions;
CREATE POLICY "Authenticated users can update extensions"
  ON extensions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);