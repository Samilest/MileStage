/*
  # Allow Public Read Access for Stage Payments
  
  1. Changes
    - Update RLS policy to allow anyone (including unauthenticated clients) to read stage payment records
    - This enables clients viewing the portal via share_code to see their payment status
  
  2. Security
    - Read-only access for all users
    - Write operations still require authentication (freelancer verification)
*/

DROP POLICY IF EXISTS "Authenticated users can read stage payments" ON stage_payments;
CREATE POLICY "Anyone can read stage payments"
  ON stage_payments FOR SELECT
  USING (true);
