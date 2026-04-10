import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, LogIn, AlertCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useNavigate } from "react-router";
import { supabase } from "../../config/supabase";
import { useMessages } from "../../hooks/useMessages";
import { toast } from "sonner";

interface ChatModalProps {
  charger: {
    id: string; // This is the listing_id
    title: string;
    ownerId: string;
    ownerName: string;
    ownerAvatar: string;
  };
  onClose: () => void;
}

export function ChatModal({ charger, onClose }: ChatModalProps) {
  const { user, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initLoading, setInitLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, loading: messagesLoading, sendMessage } = useMessages(conversationId || undefined);

  // Initialize conversation
  useEffect(() => {
    if (!user || user.id === charger.ownerId) {
      setInitLoading(false);
      return;
    }

    const init = async () => {
      setInitLoading(true);
      try {
        // Find existing conversation
        const { data: existing, error: findError } = await supabase
          .from("conversations")
          .select("id")
          .eq("listing_id", charger.id)
          .eq("customer_id", user.id)
          .maybeSingle();

        if (findError) throw findError;

        if (existing) {
          setConversationId(existing.id);
        } else {
          // Create new
          const { data: newConv, error: createError } = await supabase
            .from("conversations")
            .insert({
              listing_id: charger.id,
              host_id: charger.ownerId,
              customer_id: user.id,
            })
            .select("id")
            .single();
          
          if (createError) throw createError;
          if (newConv) setConversationId(newConv.id);
        }
      } catch (err: any) {
        console.error("Init conversation error:", err);
        toast.error("Could not start conversation. Check if database tables are ready.");
      } finally {
        setInitLoading(false);
      }
    };

    init();
  }, [user, charger]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId) {
      if (!conversationId && !initLoading) {
        toast.error("Chat is not initialized yet. Wait a moment.");
      }
      return;
    }
    
    setIsSending(true);
    const content = input;
    setInput(""); // Optimistic clear
    try {
      await sendMessage(content);
    } catch (err) {
      toast.error("Failed to send message.");
      setInput(content); // Restore
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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

  // Hide if owner
  if (user.id === charger.ownerId) return null;

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
          {initLoading || messagesLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-slate-400 text-[0.8rem]">Loading messages...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMine = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[0.85rem] leading-relaxed ${
                        isMine
                          ? "bg-primary text-white rounded-tr-sm shadow-sm shadow-primary/20"
                          : "bg-white text-slate-800 rounded-tl-sm border border-slate-100 shadow-sm"
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                      <p className={`text-[0.6rem] mt-1 ${isMine ? "text-white/60 text-right" : "text-slate-400"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {
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

        {/* Input bar */}
        <div className="px-4 py-3 bg-white border-t border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl border px-4 py-2 transition-colors border-slate-200 focus-within:border-primary">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={initLoading}
              className="flex-1 bg-transparent outline-none text-[0.875rem] text-slate-800 placeholder:text-slate-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || initLoading || isSending}
              className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center disabled:opacity-40 transition-all active:scale-95 flex-shrink-0 shadow-lg shadow-primary/20"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
