/*
  # Add requested_at column to revisions table

  1. Changes
    - Add `requested_at` column to revisions table with default value of now()
    - Backfill existing records to use created_at as requested_at

  2. Purpose
    - Fix missing requested_at column that prevents revision queries from working
    - Maintain backward compatibility with existing revision records
*/

-- Add requested_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'revisions' AND column_name = 'requested_at'
  ) THEN
    ALTER TABLE revisions ADD COLUMN requested_at TIMESTAMPTZ DEFAULT now();
    
    -- Backfill existing records: use created_at as requested_at
    UPDATE revisions SET requested_at = created_at WHERE requested_at IS NULL;
  END IF;
END $$;
