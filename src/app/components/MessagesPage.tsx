import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useApp } from "../context/AppContext";
import { useConversations } from "../../hooks/useConversations";
import { useMessages } from "../../hooks/useMessages";
import { ChevronLeft, Send, MessageCircle, AlertCircle } from "lucide-react";

export function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useApp();
  const { conversations, loading: convLoading, totalUnread } = useConversations();
  const [activeId, setActiveId] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="p-8 text-center bg-slate-50 h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sign In Required</h2>
        <p className="text-slate-500 mt-2 text-sm max-w-[250px]">
          Please sign in to view your messages and continue conversations.
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="mt-8 w-full max-w-[200px] py-3.5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 active:scale-95 transition-all"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  // Mobile layout restricts us to either ListView or ThreadView strictly.
  if (activeId) {
    return <ActiveThread conversationId={activeId} onBack={() => setActiveId(null)} user={user} />;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 relative overflow-hidden">
      {/* HEADER SECTION */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-100/80 px-6 py-5 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Messages</h1>
        {totalUnread > 0 && (
          <div className="bg-red-500 text-white text-[0.65rem] font-black uppercase tracking-wider px-2 py-1 rounded-full shadow-lg shadow-red-500/20 animate-in pop-in duration-300">
            {totalUnread} New
          </div>
        )}
      </div>

      {/* CONVERSATION LIST */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-[env(safe-area-inset-bottom)]">
        {convLoading ? (
          <div className="flex flex-col gap-4 p-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-slate-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh] p-8 text-center animate-in fade-in duration-700">
            <div className="relative w-32 h-32 mb-6 pointer-events-none">
              <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping opacity-75" />
              <div className="absolute inset-2 bg-primary/10 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <MessageCircle className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-800">Your Inbox is Empty</h3>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-[250px]">
              When you contact hosts or receive booking inquiries, they'll appear here.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-8 px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold shadow-sm hover:border-primary hover:text-primary active:scale-95 transition-all text-sm"
            >
              Explore Chargers
            </button>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {conversations.map((conv) => {
              const isHost = conv.host_id === user.id;
              const otherProfile = isHost ? conv.customer_profile : conv.host_profile;
              const unread = isHost ? conv.host_unread_count : conv.customer_unread_count;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`relative flex items-center gap-4 p-4 rounded-3xl cursor-pointer active:scale-[0.98] transition-all
                    ${unread > 0 ? "bg-white shadow-xl shadow-primary/5 border border-primary/10" : "bg-white/60 hover:bg-white border border-transparent"}
                  `}
                >
                  {/* AVATAR */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={otherProfile?.avatar_url || "https://i.pravatar.cc/150"}
                      alt="..."
                      className={`w-14 h-14 rounded-full object-cover shadow-inner ${unread > 0 ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    />
                    {unread > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md animate-pulse" />
                    )}
                  </div>

                  {/* PREVIEW CONTENT */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <p className={`font-bold truncate ${unread > 0 ? "text-slate-900" : "text-slate-700"}`}>
                        {otherProfile?.name || "Unknown User"}
                      </p>
                      <p className={`text-[0.65rem] font-bold flex-shrink-0 ml-3 ${unread > 0 ? 'text-primary' : 'text-slate-400'}`}>
                        {conv.last_message_at
                          ? new Date(conv.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[0.6rem] font-black uppercase tracking-wider rounded-md truncate">
                        {conv.charger?.title || "Listing Inquiry"}
                      </span>
                    </div>
                    <p className={`text-[0.8rem] truncate leading-tight ${unread > 0 ? "font-semibold text-slate-800" : "font-medium text-slate-500"}`}>
                      {conv.last_message || "Started a new conversation..."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveThread({ conversationId, onBack, user }: { conversationId: string; onBack: () => void; user: any }) {
  const { messages, loading, sendMessage } = useMessages(conversationId);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 absolute inset-0 z-20 animate-in slide-in-from-right-8 duration-300">
      {/* THREAD HEADER */}
      <div className="flex items-center gap-3 px-4 py-4 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm z-30">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors -ml-2"
        >
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[1.05rem] font-black text-slate-900 truncate">Chat Thread</h2>
          <p className="text-[0.7rem] text-emerald-500 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Match
          </p>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-slate-50/50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {messages.length === 0 && (
              <div className="text-center py-10 opacity-60">
                <div className="bg-black/5 text-slate-500 text-xs font-bold px-4 py-2 rounded-full inline-block">
                  This is the beginning of your conversation
                </div>
              </div>
            )}
            {messages.map((msg, index) => {
              const isMine = msg.sender_id === user.id;
              const isFirstInGroup = index === 0 || messages[index - 1].sender_id !== msg.sender_id;
              return (
                <div
                  key={msg.id}
                  className={`flex w-full ${isMine ? "justify-end" : "justify-start"} ${isFirstInGroup ? "mt-6" : "mt-1"}`}
                >
                  <div
                    className={`relative max-w-[80%] px-5 py-3 text-[0.9rem] leading-relaxed shadow-sm
                      ${
                        isMine
                          ? "bg-gradient-to-br from-primary to-emerald-600 text-white rounded-3xl rounded-tr-md shadow-primary/20"
                          : "bg-white text-slate-800 border border-slate-100 rounded-3xl rounded-tl-md"
                      }
                    `}
                  >
                    <p className="break-words">{msg.content}</p>
                    <p
                      className={`text-[0.6rem] font-bold mt-1.5 select-none ${
                        isMine ? "text-white/60 text-right" : "text-slate-400"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} className="h-1 w-full" />
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-30">
        <div className="flex items-end gap-2 bg-slate-50/80 rounded-[1.5rem] border border-slate-200 focus-within:border-primary/50 focus-within:bg-white focus-within:shadow-inner transition-all px-4 py-2">
          <textarea
            className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-800 placeholder:text-slate-400 min-h-[44px] max-h-32 py-3 resize-none"
            placeholder="Write a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            style={{
              height: input ? `${Math.min(120, Math.max(44, input.split('\n').length * 20 + 24))}px` : '44px'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`w-11 h-11 mb-0.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              input.trim()
                ? "bg-primary shadow-lg shadow-primary/30 text-white active:scale-90"
                : "bg-slate-200 text-slate-400"
            }`}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
