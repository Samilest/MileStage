/*
  # Add Stage Payment Tracking

  1. New Table
    - `stage_payments` table to track stage payment transactions
      - `id` (uuid, primary key)
      - `stage_id` (uuid, foreign key to stages)
      - `amount` (numeric) - Payment amount
      - `reference_code` (text) - Unique payment reference
      - `status` (text) - marked_paid, verified, rejected
      - `marked_paid_at` (timestamp) - When client marked payment sent
      - `verified_at` (timestamp) - When freelancer verified payment
      - `rejected_at` (timestamp) - If payment wasn't received
      - `rejection_reason` (text) - Reason for rejection
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Allow public insert (client can mark payment sent)
    - Allow authenticated read (freelancer can see pending payments)
    - Allow authenticated update (freelancer can verify/reject)
*/

CREATE TABLE IF NOT EXISTS stage_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES stages(id),
  amount numeric NOT NULL DEFAULT 0,
  reference_code text,
  status text DEFAULT 'marked_paid',
  marked_paid_at timestamptz,
  verified_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stage_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert stage payments" ON stage_payments;
CREATE POLICY "Anyone can insert stage payments"
  ON stage_payments FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read stage payments" ON stage_payments;
CREATE POLICY "Authenticated users can read stage payments"
  ON stage_payments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can update stage payments" ON stage_payments;
CREATE POLICY "Authenticated users can update stage payments"
  ON stage_payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);