/*
  # Add Revision Tracking and Delivery Fields
  
  1. Changes to stages table
    - Add `revisions_included` (INTEGER DEFAULT 2) - Number of revisions allowed per stage
    - Add `revisions_used` (INTEGER DEFAULT 0) - Number of revisions used so far
    - Add `delivered_at` (TIMESTAMPTZ) - When freelancer marked stage as delivered
  
  2. Purpose
    - Track how many revision requests the client has made
    - Enable revision limit enforcement
    - Track delivery timestamps for workflow progression
  
  3. Notes
    - Default 2 revisions per stage (industry standard)
    - Counter increments when client requests changes
    - delivered_at is set when freelancer clicks "Mark as Delivered"
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stages' AND column_name = 'revisions_included'
  ) THEN
    ALTER TABLE stages ADD COLUMN revisions_included INTEGER DEFAULT 2;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stages' AND column_name = 'revisions_used'
  ) THEN
    ALTER TABLE stages ADD COLUMN revisions_used INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stages' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE stages ADD COLUMN delivered_at TIMESTAMPTZ;
  END IF;
END $$;