/*
  # Add completed_at column to revisions table

  1. Changes
    - Add `completed_at` column to revisions table to track when revisions are completed
    - This allows distinguishing between pending and completed revisions
    - NULL value means revision is still pending
    - Non-NULL value means revision was addressed and work was re-delivered

  2. Purpose
    - Track revision lifecycle from request to completion
    - Display accurate status badges (Pending vs Completed)
    - Enable better revision history tracking
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'revisions' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE revisions ADD COLUMN completed_at timestamptz;
  END IF;
END $$;