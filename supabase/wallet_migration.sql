-- ============================================================
-- Wallet Migration (run this in Supabase SQL Editor)
-- Only adds the NEW wallet features to your existing schema
-- ============================================================

-- 1. Add wallet_balance column to profiles (safe if already exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10,2) DEFAULT 50000.00;

-- 2. Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT CHECK (type IN ('credit', 'debit')),
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on wallet_transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Create policy (drop first if exists to avoid conflict)
DROP POLICY IF EXISTS "wallet_tx_all" ON wallet_transactions;
CREATE POLICY "wallet_tx_all" ON wallet_transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
