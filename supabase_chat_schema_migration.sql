-- ============================================================
-- PlugPoint Chat Schema Migration
-- Run this in: Supabase → SQL Editor → Run
-- ============================================================
-- IMPORTANT: This project uses Firebase Auth (TEXT UIDs),
-- NOT Supabase Auth. All user IDs are TEXT referencing profiles(id).
-- ============================================================

-- Drop old broken tables if they exist
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- conversations table
CREATE TABLE public.conversations (
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

-- messages table
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

-- ============================================================
-- Row Level Security (permissive for MVP — matches rest of project)
-- Firebase Auth is used, not Supabase Auth, so we can't use auth.uid()
-- ============================================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_all" ON public.conversations
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "messages_all" ON public.messages
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Enable Realtime for live chat
-- NOTE: You must also enable Realtime in Dashboard → Database → Replication
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
