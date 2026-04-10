-- Fixed Chat Schema for PlugPoint
-- Compatible with TEXT IDs from Firebase/Mock Data

-- Drop old broken tables if they exist
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- conversations table
CREATE TABLE public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.chargers(id) ON DELETE CASCADE,
  host_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
  sender_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

-- RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Explicitly grant permissions to anon (Firebase users)
GRANT ALL ON public.conversations TO anon, authenticated, service_role;
GRANT ALL ON public.messages TO anon, authenticated, service_role;

-- conversations policies
CREATE POLICY "conversations_all" ON public.conversations 
  FOR ALL USING (true) WITH CHECK (true);

-- messages policies
CREATE POLICY "messages_all" ON public.messages 
  FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

