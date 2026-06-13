import { useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { useApp } from "../app/context/AppContext";
import { Message } from "../types/chat";

export function useMessages(conversationId?: string) {
  const { user } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId || !user) {
      setLoading(false);
      return;
    }

    const markAsRead = async () => {
      try {
        const { data: conv } = await supabase
          .from("conversations")
          .select("host_id, customer_id")
          .eq("id", conversationId)
          .single();

        if (conv) {
          if (conv.host_id === user.id) {
            await supabase
              .from("conversations")
              .update({ host_unread_count: 0 })
              .eq("id", conversationId);
          } else if (conv.customer_id === user.id) {
            await supabase
              .from("conversations")
              .update({ customer_unread_count: 0 })
              .eq("id", conversationId);
          }
        }
      } catch (err) {
        console.error("Error resetting unread count:", err);
      }
    };

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data: msgs, error: fetchErr } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (!fetchErr && msgs) {
          setMessages(msgs as Message[]);
        }
        await markAsRead();
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          markAsRead(); // Reset count without full refetch
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const sendMessage = async (content: string): Promise<{ success: boolean; error?: any }> => {
    if (!conversationId || !user || !content.trim()) return { success: false, error: "Missing required fields" };

    try {
      // 1. Insert into messages
      const { data: newMessage, error: insertErr } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // 2. Fetch conversation to determine roles
      const { data: conv } = await supabase
        .from("conversations")
        .select("host_id, customer_id, host_unread_count, customer_unread_count")
        .eq("id", conversationId)
        .single();

      if (!conv) return { success: false, error: "Conversation not found" };

      // 3. Update conversations
      const isHost = conv.host_id === user.id;
      const updates = {
        last_message: content.trim(),
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(isHost
          ? { customer_unread_count: (conv.customer_unread_count || 0) + 1 }
          : { host_unread_count: (conv.host_unread_count || 0) + 1 }),
      };

      await supabase.from("conversations").update(updates).eq("id", conversationId);
      
      return { success: true };
    } catch (err) {
      console.error("Error sending message:", err);
      return { success: false, error: err };
    }
  };

  return { messages, loading, sendMessage };
}
