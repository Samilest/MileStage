/*
  # Add Approved At Timestamp
  
  1. Changes to stages table
    - Add `approved_at` (TIMESTAMPTZ) - When client approved the stage
  
  2. Purpose
    - Track when client clicks "Approve & Continue to Payment"
    - Enable audit trail of approval timeline
    - Support workflow progression tracking
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stages' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE stages ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;
END $$;
