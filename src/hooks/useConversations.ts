import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { useApp } from "../app/context/AppContext";
import { Conversation } from "../types/chat";

export function useConversations() {
  const { user } = useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchConversations = async () => {
      try {
        setLoading(true);
        // Supabase query equivalent: fetch where host_id = user.id OR customer_id = user.id
        // Since we don't have joined tables explicitly defined in the schema in a view,
        // we might just fetch the raw conversations for now. Wait, the prompt says:
        // "Join charger title, customer profile, host profile"
        // Let's assume there are foreign keys set up correctly in Supabase.
        const { data, error } = await supabase
          .from("conversations")
          .select(`
            *,
            charger:chargers!conversations_listing_id_fkey(id, title),
            customer_profile:profiles!conversations_customer_id_fkey(full_name, avatar_url),
            host_profile:profiles!conversations_host_id_fkey(full_name, avatar_url)
          `)
          .or(`host_id.eq.${user.id},customer_id.eq.${user.id}`)
          .order("last_message_at", { ascending: false });

        if (!error && data) {
          setConversations(data as unknown as Conversation[]);
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    const channel = supabase
      .channel("conversations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `host_id=eq.${user.id}`, // We can't do OR in filter, need to subscribe to both or without filter
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `customer_id=eq.${user.id}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const totalUnread = conversations.reduce((sum, conv) => {
    if (conv.host_id === user?.id) {
      return sum + (conv.host_unread_count || 0);
    }
    if (conv.customer_id === user?.id) {
      return sum + (conv.customer_unread_count || 0);
    }
    return sum;
  }, 0);

  return { conversations, loading, totalUnread };
}
