/*
  # Add rejection tracking to extensions

  1. Updates
    - Add rejection_reason field to extensions table
    - Ensures rejected_at field exists (was added in previous migration)

  2. Notes
    - Allows freelancers to provide reason when rejecting extension payment
    - Clients can see why their extension was rejected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'extensions' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE extensions ADD COLUMN rejection_reason text;
  END IF;
END $$;