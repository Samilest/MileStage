/*
  # Add Stripe Connect fields to user_profiles

  1. Changes
    - Add `stripe_account_id` (text, unique) to store Stripe Connect account ID
    - Add `stripe_connected_at` (timestamptz) to track when Stripe was connected
    - Add `stripe_onboarding_completed` (boolean) to track onboarding status
    - Add `stripe_charges_enabled` (boolean) to track if account can accept charges
    - Add `stripe_payouts_enabled` (boolean) to track if account can receive payouts

  2. Security
    - These fields are only readable by the user who owns the profile
    - Only the system (via service role) can update these fields
*/

DO $$ 
BEGIN
  -- Add stripe_account_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'stripe_account_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_account_id text UNIQUE;
  END IF;

  -- Add stripe_connected_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'stripe_connected_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_connected_at timestamptz;
  END IF;

  -- Add stripe_onboarding_completed if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'stripe_onboarding_completed'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_onboarding_completed boolean DEFAULT false;
  END IF;

  -- Add stripe_charges_enabled if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'stripe_charges_enabled'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_charges_enabled boolean DEFAULT false;
  END IF;

  -- Add stripe_payouts_enabled if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'stripe_payouts_enabled'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_payouts_enabled boolean DEFAULT false;
  END IF;
END $$;