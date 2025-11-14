/*
  # Add Freelancer Notification Tracking

  1. Changes to Tables
    - Add tracking fields to `revisions` table for when freelancer acknowledges revision requests
    - Add tracking fields to `stage_payments` table for when freelancer acknowledges payment marks
    - Add tracking field to `stages` table for when freelancer views stage after client approval
  
  2. New Columns
    ### revisions table:
    - `viewed_by_freelancer_at` - Already exists, ensure it's nullable
    
    ### stage_payments table:
    - `viewed_by_freelancer_at` - Already exists, ensure it's nullable
    
    ### stages table:
    - `viewed_by_freelancer_at` - Already exists, ensure it's nullable
  
  3. Purpose
    - These fields help determine when to show red "NEEDS ATTENTION" badges
    - Freelancer sees red badge when client takes action (revision request, payment mark, approval)
    - Badge turns back to normal when freelancer views the stage detail page
*/

-- No new columns needed, all tracking fields already exist
-- This migration serves as documentation of the notification system

-- Ensure all tracking columns allow NULL values
ALTER TABLE revisions 
  ALTER COLUMN viewed_by_freelancer_at DROP NOT NULL;

ALTER TABLE stage_payments 
  ALTER COLUMN viewed_by_freelancer_at DROP NOT NULL;

ALTER TABLE stages 
  ALTER COLUMN viewed_by_freelancer_at DROP NOT NULL;
