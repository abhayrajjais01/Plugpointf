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
        // Fetch conversations where user is host OR customer,
        // joining charger title and profile names from the profiles table.
        // The profiles table uses 'name' (not 'full_name').
        const { data, error } = await supabase
          .from("conversations")
          .select(`
            *,
            charger:chargers!listing_id(id, title),
            customer_profile:profiles!customer_id(name, avatar_url),
            host_profile:profiles!host_id(name, avatar_url)
          `)
          .or(`host_id.eq.${user.id},customer_id.eq.${user.id}`)
          .order("last_message_at", { ascending: false, nullsFirst: false });

        if (!error && data) {
          setConversations(data as unknown as Conversation[]);
        } else if (error) {
          console.error("Supabase conversations query error:", error);
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Subscribe to ALL conversation changes and re-fetch.
    // We can't do OR filters on realtime channels, so we listen to all
    // changes on the conversations table and filter client-side in fetchConversations.
    const channel = supabase
      .channel("conversations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
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
