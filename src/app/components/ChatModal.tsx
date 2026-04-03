import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, MessageCircle, AlertCircle, LogIn } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router";
import { supabase } from "../../config/supabase";

interface Conversation {
  id: string;
  chargerId: string;
  chargerTitle: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  bookerId: string;
  bookerName: string;
  bookerAvatar: string;
  lastMessage: string;
  lastMessageAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface ChatModalProps {
  charger: {
    id: string;
    title: string;
    ownerId: string;
    ownerName: string;
    ownerAvatar: string;
  };
  onClose: () => void;
}

function mapConversation(row: any): Conversation {
  return {
    id: row.id,
    chargerId: row.charger_id,
    chargerTitle: row.charger_title,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerAvatar: row.owner_avatar,
    bookerId: row.booker_id,
    bookerName: row.booker_name,
    bookerAvatar: row.booker_avatar,
    lastMessage: row.last_message ?? "",
    lastMessageAt: row.last_message_at,
  };
}

function mapMessage(row: any): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderAvatar: row.sender_avatar,
    content: row.content,
    read: row.read,
    createdAt: row.created_at,
  };
}

async function getOrCreateConversation(
  charger: ChatModalProps["charger"],
  booker: { id: string; name: string; avatar: string }
): Promise<{ data: Conversation | null; error: string | null }> {
  try {
    // Try find existing first
    const { data: existing, error: findErr } = await supabase
      .from("conversations")
      .select("*")
      .eq("charger_id", charger.id)
      .eq("booker_id", booker.id)
      .maybeSingle();

    if (findErr) return { data: null, error: findErr.message };
    if (existing) return { data: mapConversation(existing), error: null };

    // Create new
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        charger_id: charger.id,
        charger_title: charger.title,
        owner_id: charger.ownerId,
        owner_name: charger.ownerName,
        owner_avatar: charger.ownerAvatar,
        booker_id: booker.id,
        booker_name: booker.name,
        booker_avatar: booker.avatar,
        last_message: "",
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: mapConversation(data), error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) { console.error("fetchMessages:", error.message); return []; }
  return (data ?? []).map(mapMessage);
}

async function sendMessage(
  conversationId: string,
  sender: { id: string; name: string; avatar: string },
  content: string
): Promise<{ data: Message | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: sender.id,
        sender_name: sender.name,
        sender_avatar: sender.avatar,
        content: content.trim(),
        read: false,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    // Update last message on conversation
    await supabase
      .from("conversations")
      .update({
        last_message: content.trim(),
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    return { data: mapMessage(data), error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export function ChatModal({ charger, onClose }: ChatModalProps) {
  const { user, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [initLoading, setInitLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOwner = user?.id === charger.ownerId;

  // Init conversation
  useEffect(() => {
    if (!user || isOwner) {
      setInitLoading(false);
      return;
    }

    const init = async () => {
      setInitLoading(true);
      setInitError(null);

      const { data: conv, error } = await getOrCreateConversation(charger, {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      });

      if (error || !conv) {
        setInitError(error || "Could not start conversation. Please try again.");
        setInitLoading(false);
        return;
      }

      setConversation(conv);

      const msgs = await fetchMessages(conv.id);
      setMessages(msgs);
      setInitLoading(false);

      // Focus input after load
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    init();
  }, [user?.id]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!conversation?.id) return;

    const channelName = `chat-${conversation.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          if (!payload.new) return;
          const incoming: Message = {
            id: payload.new.id,
            conversationId: payload.new.conversation_id,
            senderId: payload.new.sender_id,
            senderName: payload.new.sender_name,
            senderAvatar: payload.new.sender_avatar,
            content: payload.new.content,
            read: payload.new.read,
            createdAt: payload.new.created_at,
          };
          setMessages((prev) => {
            // Deduplicate
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !conversation || !user || sending) return;

    setSending(true);
    setSendError(null);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversationId: conversation.id,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      content: trimmed,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    const { data: saved, error } = await sendMessage(
      conversation.id,
      { id: user.id, name: user.name, avatar: user.avatar },
      trimmed
    );

    if (error || !saved) {
      // Rollback optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(trimmed);
      setSendError("Failed to send. Tap to retry.");
    } else {
      // Replace temp with real message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? saved : m))
      );
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Not logged in state
  if (!isAuthenticated || !user) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-[1.1rem] font-black text-slate-900">Sign in to chat</h3>
          <p className="text-slate-400 text-[0.85rem] mt-2">You need to be signed in to message the host.</p>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 border border-slate-100 rounded-2xl text-[0.875rem] font-bold text-slate-400">
              Cancel
            </button>
            <button
              onClick={() => { onClose(); navigate("/auth"); }}
              className="flex-1 py-3 bg-primary text-white rounded-2xl text-[0.875rem] font-bold shadow-lg shadow-primary/20"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Owner trying to chat with themselves
  if (isOwner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: "75vh", maxHeight: "600px" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0 z-10">
          <div className="relative">
            <img
              src={charger.ownerAvatar}
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://i.pravatar.cc/150?img=1";
              }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.9rem] font-bold text-slate-900 truncate leading-tight">{charger.ownerName}</p>
            <p className="text-[0.7rem] text-emerald-500 font-bold">● Online · {charger.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center flex-shrink-0"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50">
          {initLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-slate-400 text-[0.8rem]">Starting conversation...</p>
            </div>
          ) : initError ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <p className="text-slate-700 font-bold text-[0.9rem]">Couldn't load chat</p>
                <p className="text-slate-400 text-[0.75rem] mt-1">{initError}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-[0.8rem] font-bold"
              >
                Retry
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-slate-700 text-[0.9rem] font-black">Say hi to {charger.ownerName}!</p>
                <p className="text-slate-400 text-[0.75rem] mt-1 leading-relaxed">
                  Ask about parking access, cable type,<br />or when the charger is free.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {["Is it available this evening?", "What's the parking like?", "Hi, I'd like to book!"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[0.72rem] text-slate-500 font-medium hover:border-primary hover:text-primary transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMine = msg.senderId === user.id;
                const isTemp = msg.id.startsWith("temp-");
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                    {!isMine && (
                      <img
                        src={msg.senderAvatar}
                        className="w-7 h-7 rounded-full flex-shrink-0 mt-auto border border-white shadow-sm object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://i.pravatar.cc/150?img=1";
                        }}
                      />
                    )}
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[0.85rem] leading-relaxed ${
                        isMine
                          ? `bg-primary text-white rounded-tr-sm shadow-sm shadow-primary/20 ${isTemp ? "opacity-70" : ""}`
                          : "bg-white text-slate-800 rounded-tl-sm border border-slate-100 shadow-sm"
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                      <p className={`text-[0.6rem] mt-1 ${isMine ? "text-white/60 text-right" : "text-slate-400"}`}>
                        {isTemp ? "Sending..." : new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Send error */}
        {sendError && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex-shrink-0">
            <p className="text-red-500 text-[0.75rem] font-medium text-center">{sendError}</p>
          </div>
        )}

        {/* Input bar */}
        <div className="px-4 py-3 bg-white border-t border-slate-100 flex-shrink-0">
          <div className={`flex items-center gap-2 bg-slate-50 rounded-2xl border px-4 py-2 transition-colors ${
            initError ? "opacity-50 pointer-events-none" : "border-slate-200 focus-within:border-primary"
          }`}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={initLoading ? "Loading..." : `Message ${charger.ownerName}...`}
              disabled={initLoading || !!initError}
              className="flex-1 bg-transparent outline-none text-[0.875rem] text-slate-800 placeholder:text-slate-400 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || initLoading || !!initError}
              className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center disabled:opacity-40 transition-all active:scale-95 flex-shrink-0"
            >
              {sending
                ? <Loader2 className="w-4 h-4 animate-spin text-white" />
                : <Send className="w-4 h-4 text-white" />
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
