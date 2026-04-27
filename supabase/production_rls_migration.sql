-- ============================================================
-- PlugPoint Production RLS Migration
-- ============================================================
-- Run this only after the client sends a Supabase-compatible JWT whose
-- `sub` claim is the Firebase UID stored in profiles.id.
--
-- The current MVP schema uses permissive anon policies so Firebase Auth can
-- talk directly to Supabase. This migration is the production hardening path:
-- users can read marketplace data, but writes are limited to their own rows.
-- Wallet balance writes should move behind an Edge Function/service role.
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT NULLIF(auth.jwt() ->> 'sub', '');
$$;

-- Remove MVP-wide policies.
DROP POLICY IF EXISTS "profiles_all" ON public.profiles;
DROP POLICY IF EXISTS "chargers_all" ON public.chargers;
DROP POLICY IF EXISTS "bookings_all" ON public.bookings;
DROP POLICY IF EXISTS "reviews_all" ON public.reviews;
DROP POLICY IF EXISTS "wallet_tx_all" ON public.wallet_transactions;
DROP POLICY IF EXISTS "conversations_all" ON public.conversations;
DROP POLICY IF EXISTS "messages_all" ON public.messages;

-- Profiles: public profile data is readable for host/chat UI, but users can
-- only create or edit their own profile.
CREATE POLICY "profiles_read_all"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = public.current_app_user_id());

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = public.current_app_user_id())
WITH CHECK (id = public.current_app_user_id());

REVOKE UPDATE (wallet_balance) ON public.profiles FROM anon, authenticated;

-- Chargers: everyone can discover stations; only the owner can mutate them.
CREATE POLICY "chargers_read_all"
ON public.chargers
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "chargers_insert_own"
ON public.chargers
FOR INSERT
TO authenticated
WITH CHECK (owner_id = public.current_app_user_id());

CREATE POLICY "chargers_update_own"
ON public.chargers
FOR UPDATE
TO authenticated
USING (owner_id = public.current_app_user_id())
WITH CHECK (owner_id = public.current_app_user_id());

CREATE POLICY "chargers_delete_own"
ON public.chargers
FOR DELETE
TO authenticated
USING (owner_id = public.current_app_user_id());

-- Bookings: drivers see their own bookings; hosts see bookings for their
-- chargers.
CREATE POLICY "bookings_read_participant"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  user_id = public.current_app_user_id()
  OR EXISTS (
    SELECT 1
    FROM public.chargers c
    WHERE c.id = bookings.charger_id
      AND c.owner_id = public.current_app_user_id()
  )
);

CREATE POLICY "bookings_insert_customer"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (user_id = public.current_app_user_id());

CREATE POLICY "bookings_update_customer_or_host"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  user_id = public.current_app_user_id()
  OR EXISTS (
    SELECT 1
    FROM public.chargers c
    WHERE c.id = bookings.charger_id
      AND c.owner_id = public.current_app_user_id()
  )
)
WITH CHECK (
  user_id = public.current_app_user_id()
  OR EXISTS (
    SELECT 1
    FROM public.chargers c
    WHERE c.id = bookings.charger_id
      AND c.owner_id = public.current_app_user_id()
  )
);

-- Reviews: readable marketplace data; only the reviewer can create/edit/delete.
CREATE POLICY "reviews_read_all"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "reviews_insert_own"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (user_id = public.current_app_user_id());

CREATE POLICY "reviews_update_own"
ON public.reviews
FOR UPDATE
TO authenticated
USING (user_id = public.current_app_user_id())
WITH CHECK (user_id = public.current_app_user_id());

CREATE POLICY "reviews_delete_own"
ON public.reviews
FOR DELETE
TO authenticated
USING (user_id = public.current_app_user_id());

-- Wallet transactions: users can read their own ledger only. Inserts/credits
-- should be performed by an Edge Function using the service role key.
CREATE POLICY "wallet_transactions_read_own"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (user_id = public.current_app_user_id());

-- Chat: both sides of a conversation can read/update the conversation and
-- insert messages as themselves.
CREATE POLICY "conversations_read_participant"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  host_id = public.current_app_user_id()
  OR customer_id = public.current_app_user_id()
);

CREATE POLICY "conversations_insert_customer"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  customer_id = public.current_app_user_id()
  AND EXISTS (
    SELECT 1
    FROM public.chargers c
    WHERE c.id = conversations.listing_id
      AND c.owner_id = conversations.host_id
  )
);

CREATE POLICY "conversations_update_participant"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  host_id = public.current_app_user_id()
  OR customer_id = public.current_app_user_id()
)
WITH CHECK (
  host_id = public.current_app_user_id()
  OR customer_id = public.current_app_user_id()
);

CREATE POLICY "messages_read_participant"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.host_id = public.current_app_user_id()
        OR c.customer_id = public.current_app_user_id()
      )
  )
);

CREATE POLICY "messages_insert_participant"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = public.current_app_user_id()
  AND EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.host_id = public.current_app_user_id()
        OR c.customer_id = public.current_app_user_id()
      )
  )
);

-- Storage reminder:
-- Add equivalent bucket policies for charger-images before using this in
-- production. Uploads should require owner-scoped paths like `${uid}/file`.
