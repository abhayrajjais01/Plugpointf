import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, MessageCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
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
    lastMessage: row.last_message,
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
): Promise<Conversation | null> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("charger_id", charger.id)
    .eq("booker_id", booker.id)
    .maybeSingle();

  if (existing) return mapConversation(existing);

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

  if (error) { console.error("getOrCreateConversation:", error.message); return null; }
  return mapConversation(data);
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
): Promise<Message | null> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: sender.id,
      sender_name: sender.name,
      sender_avatar: sender.avatar,
      content,
    })
    .select()
    .single();

  if (error) { console.error("sendMessage:", error.message); return null; }

  await supabase
    .from("conversations")
    .update({ last_message: content, last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return mapMessage(data);
}

export function ChatModal({ charger, onClose }: ChatModalProps) {
  const { user } = useApp();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isOwner = user?.id === charger.ownerId;

  useEffect(() => {
    if (!user || isOwner) return;

    const init = async () => {
      const conv = await getOrCreateConversation(charger, {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      });
      if (!conv) return;
      setConversation(conv);
      const msgs = await fetchMessages(conv.id);
      setMessages(msgs);
      setLoading(false);
    };
    init();
  }, [user]);

  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMsg: Message = {
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
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversation || !user || sending) return;
    setSending(true);
    const msg = await sendMessage(
      conversation.id,
      { id: user.id, name: user.name, avatar: user.avatar },
      input.trim()
    );
    if (msg) setMessages((prev) => [...prev, msg]);
    setInput("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isOwner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: "75vh" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0">
          <img
            src={charger.ownerAvatar}
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[0.9rem] font-bold text-slate-900 truncate">{charger.ownerName}</p>
            <p className="text-[0.7rem] text-slate-400 font-medium truncate">Host · {charger.title}</p>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full flex-shrink-0">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span className="text-[0.6rem] text-emerald-600 font-bold uppercase tracking-wider">Online</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-slate-700 text-[0.9rem] font-bold">Say hi to {charger.ownerName}!</p>
                <p className="text-slate-400 text-[0.75rem] mt-1">
                  Ask about parking access, cable length, or availability.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                  {!isMine && (
                    <img
                      src={msg.senderAvatar}
                      className="w-7 h-7 rounded-full flex-shrink-0 mt-1 border border-white shadow-sm object-cover"
                    />
                  )}
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[0.85rem] leading-relaxed shadow-sm ${
                      isMine
                        ? "bg-primary text-white rounded-tr-sm"
                        : "bg-white text-slate-800 rounded-tl-sm border border-slate-100"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-[0.6rem] mt-1 ${isMine ? "text-white/60 text-right" : "text-slate-400"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 bg-white border-t border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-2 focus-within:border-primary transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${charger.ownerName}...`}
              className="flex-1 bg-transparent outline-none text-[0.875rem] text-slate-800 placeholder:text-slate-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
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
