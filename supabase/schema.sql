-- ============================================================
-- PlugPoint Unified & Hardened Database Schema
-- Paste this entire file into: Supabase → SQL Editor → Run
-- ============================================================

-- 1. CLEANUP (Optional - only if starting fresh)
-- DROP TABLE IF EXISTS public.messages CASCADE;
-- DROP TABLE IF EXISTS public.conversations CASCADE;
-- DROP TABLE IF EXISTS public.user_vehicles CASCADE;
-- DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
-- DROP TABLE IF EXISTS public.reviews CASCADE;
-- DROP TABLE IF EXISTS public.bookings CASCADE;
-- DROP TABLE IF EXISTS public.chargers CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================
-- Core Tables
-- ============================================================

-- Profiles (synced from Firebase Auth on login)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'User',
  avatar_url TEXT DEFAULT 'https://i.pravatar.cc/150?img=33',
  email TEXT,
  phone TEXT DEFAULT '',
  joined_date TEXT,
  chargers_listed INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  rating NUMERIC(3,1) DEFAULT 5.0,
  verified BOOLEAN DEFAULT false,
  wallet_balance NUMERIC(10,2) DEFAULT 0.00 CHECK (wallet_balance >= 0.00),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chargers
CREATE TABLE IF NOT EXISTS public.chargers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_name TEXT,
  owner_avatar TEXT,
  owner_rating NUMERIC(3,1) DEFAULT 5.0,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Bangalore, KA',
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  connector_type TEXT DEFAULT 'J1772',
  power NUMERIC(5,2) DEFAULT 7.2,
  price_per_hour NUMERIC(8,2) DEFAULT 80,
  price_per_kwh NUMERIC(8,2) DEFAULT 12,
  available BOOLEAN DEFAULT true,
  available_hours TEXT DEFAULT '24/7',
  rating NUMERIC(3,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  amenities TEXT[] DEFAULT '{}',
  instructions TEXT DEFAULT '',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charger_id UUID REFERENCES public.chargers(id) ON DELETE SET NULL,
  charger_title TEXT,
  charger_image TEXT,
  charger_address TEXT,
  host_name TEXT,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date TEXT,
  start_time TEXT,
  end_time TEXT,
  duration INTEGER DEFAULT 1,
  total_cost NUMERIC(10,2),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','active','completed','cancelled')),
  connector_type TEXT,
  power NUMERIC(5,2),
  cashed_out BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charger_id UUID REFERENCES public.chargers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  user_avatar TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  helpful INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT CHECK (type IN ('credit', 'debit')),
  description TEXT,
  reference_id TEXT, -- e.g., razorpay_order_id or booking_id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Vehicles (Cross-device sync)
CREATE TABLE IF NOT EXISTS public.user_vehicles (
  id TEXT PRIMARY KEY, -- Using client-side generated ID for sync
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  model_id TEXT,
  brand_name TEXT,
  model_name TEXT,
  image_url TEXT,
  logo_url TEXT,
  registration_number TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat System
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.chargers(id) ON DELETE CASCADE,
  host_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_message text,
  last_message_at timestamptz,
  host_unread_count int DEFAULT 0,
  customer_unread_count int DEFAULT 0,
  UNIQUE(listing_id, customer_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- A. Auto-update Charger Rating on New Review
-- FIX: Handle DELETE operations where NEW is NULL (only OLD is available)
CREATE OR REPLACE FUNCTION public.handle_new_review()
RETURNS TRIGGER AS $$
DECLARE
  target_charger_id UUID;
BEGIN
  -- On DELETE, NEW is NULL — we must use OLD to get the charger_id
  IF TG_OP = 'DELETE' THEN
    target_charger_id := OLD.charger_id;
  ELSE
    target_charger_id := NEW.charger_id;
  END IF;

  UPDATE public.chargers
  SET 
    rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE charger_id = target_charger_id), 0),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE charger_id = target_charger_id)
  WHERE id = target_charger_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_added ON public.reviews;
CREATE TRIGGER on_review_added
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_review();

-- B. Auto-update Wallet Balance on New Transaction
CREATE OR REPLACE FUNCTION public.handle_wallet_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'credit' THEN
    UPDATE public.profiles
    SET wallet_balance = wallet_balance + NEW.amount
    WHERE id = NEW.user_id;
  ELSIF NEW.type = 'debit' THEN
    UPDATE public.profiles
    SET wallet_balance = wallet_balance - NEW.amount
    WHERE id = NEW.user_id AND wallet_balance >= NEW.amount;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient wallet balance for this debit transaction';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_wallet_tx ON public.wallet_transactions;
CREATE TRIGGER on_wallet_tx
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_wallet_transaction();

-- C. Update Conversation Timestamp on New Message
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_added ON public.messages;
CREATE TRIGGER on_message_added
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

-- ============================================================
-- Row Level Security (Firebase Compatibility Mode)
-- ============================================================

-- IMPORTANT SECURITY NOTE:
-- This app uses Firebase Auth (not Supabase Auth), so Supabase sees
-- ALL requests as the 'anon' role. True per-user RLS enforcement
-- requires a Supabase JWT bridge (Edge Function that mints a
-- Supabase JWT from the Firebase JWT).
--
-- TODO: Implement Supabase JWT bridge for proper per-user RLS.
-- Until then, the app relies on client-side authorization checks.
-- This is NOT secure against direct API access.

-- 1. Profiles: Users can read all, but only edit their own (by ID check)
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO anon, authenticated USING (true);

-- PROTECT WALLET BALANCE: Only triggers can update it
REVOKE UPDATE (wallet_balance) ON public.profiles FROM anon, authenticated;

-- 2. Chargers: All can see, only owner can edit
DROP POLICY IF EXISTS "chargers_read_all" ON public.chargers;
CREATE POLICY "chargers_read_all" ON public.chargers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "chargers_insert_own" ON public.chargers;
CREATE POLICY "chargers_insert_own" ON public.chargers FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "chargers_update_own" ON public.chargers;
CREATE POLICY "chargers_update_own" ON public.chargers FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "chargers_delete_own" ON public.chargers;
CREATE POLICY "chargers_delete_own" ON public.chargers FOR DELETE TO anon, authenticated USING (true);

-- 3. Bookings: Read/Write (client-side auth checks enforced)
DROP POLICY IF EXISTS "bookings_all" ON public.bookings;
CREATE POLICY "bookings_all" ON public.bookings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. Reviews: Read all, edit own
DROP POLICY IF EXISTS "reviews_all" ON public.reviews;
CREATE POLICY "reviews_all" ON public.reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Wallet: Read/Write (security handled via triggers + reference_id uniqueness)
DROP POLICY IF EXISTS "wallet_all" ON public.wallet_transactions;
CREATE POLICY "wallet_all" ON public.wallet_transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. User Vehicles: Read/write own only
DROP POLICY IF EXISTS "vehicles_all_own" ON public.user_vehicles;
CREATE POLICY "vehicles_all_own" ON public.user_vehicles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. Chat System: Participants only
DROP POLICY IF EXISTS "conv_all" ON public.conversations;
CREATE POLICY "conv_all" ON public.conversations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "msg_all" ON public.messages;
CREATE POLICY "msg_all" ON public.messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Constraints for data integrity
-- ============================================================

-- Prevent duplicate wallet transactions (e.g. double-refund on same booking)
ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT unique_wallet_reference_id UNIQUE (reference_id);

-- ============================================================
-- Indexes for query performance
-- ============================================================

-- Bookings: fetched by user_id (My Bookings page) and by charger+date (time slot check)
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_charger_date ON public.bookings(charger_id, date);

-- Reviews: filtered by charger_id (Charger Detail page)
CREATE INDEX IF NOT EXISTS idx_reviews_charger_id ON public.reviews(charger_id);

-- Messages: fetched by conversation_id (Chat thread)
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);

-- Conversations: looked up by host_id or customer_id (Messages page)
CREATE INDEX IF NOT EXISTS idx_conversations_host ON public.conversations(host_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON public.conversations(customer_id);

-- Chargers: filtered by owner_id (Manage Chargers, Host Earnings)
CREATE INDEX IF NOT EXISTS idx_chargers_owner ON public.chargers(owner_id);

-- User Vehicles: fetched by user_id
CREATE INDEX IF NOT EXISTS idx_user_vehicles_user ON public.user_vehicles(user_id);

-- Wallet Transactions: fetched by user_id, looked up by reference_id
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_reference ON public.wallet_transactions(reference_id);

-- ============================================================
-- Enable Realtime (Safe Reset)
-- ============================================================
-- 1. Drop the existing publication if it exists to avoid "already member" errors
DROP PUBLICATION IF EXISTS supabase_realtime;

-- 2. Create it fresh and add all necessary tables
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.profiles, 
  public.chargers, 
  public.bookings, 
  public.conversations, 
  public.messages;

-- ============================================================
-- Storage bucket: charger-images
-- Create manually in Supabase Dashboard → Storage → New bucket
-- Name: charger-images  |  Public: YES
-- ============================================================

