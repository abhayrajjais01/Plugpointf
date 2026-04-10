export interface Conversation {
  id: string;
  listing_id: string;
  host_id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_at: string | null;
  host_unread_count: number;
  customer_unread_count: number;
  // joined fields — must match profiles table columns (name, avatar_url)
  charger?: { title: string; id: string };
  customer_profile?: { name: string; avatar_url: string | null };
  host_profile?: { name: string; avatar_url: string | null };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}
