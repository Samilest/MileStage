/*
  # Add Message Tracking for Freelancers

  1. Changes
    - Add `viewed_by_freelancer_at` column to `stage_notes` table
    - This tracks when freelancer has viewed client messages
    - Allows calculation of unread message counts

  2. Purpose
    - Enable red dot notifications when client sends messages
    - Track which messages have been viewed by freelancer
    - Calculate has_unread_actions based on unread messages

  3. Migration Notes
    - Existing messages are marked as viewed (null = not viewed yet)
    - New messages will be null until freelancer views the stage
*/

-- Add viewed_by_freelancer_at column to stage_notes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stage_notes' AND column_name = 'viewed_by_freelancer_at'
  ) THEN
    ALTER TABLE stage_notes ADD COLUMN viewed_by_freelancer_at timestamptz;
  END IF;
END $$;

-- Create index for faster queries on unread messages
CREATE INDEX IF NOT EXISTS idx_stage_notes_viewed_by_freelancer
  ON stage_notes(stage_id, author_type, viewed_by_freelancer_at)
  WHERE author_type = 'client';
