import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Calendar,
  MapPin,
  Clock,
  Zap,
  XCircle,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Star,
  MessageCircle,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ReviewModal } from "./ReviewModal";
import { ChatModal } from "./ChatModal";
import type { Booking } from "../data/mock-data";
import { toast } from "sonner";

// These are the categories a booking can fall into
const tabs = ["All", "Upcoming", "Active", "Completed", "Cancelled"] as const;

/**
 * --- THE BOOKINGS PAGE ---
 * This is the user's dashboard where they can see all their 
 * charging sessions. We use "Tabs" to help them filter 
 * by status (e.g., only show finished trips).
 */
export function BookingsPage() {
  const navigate = useNavigate();
  
  // cancelBooking is a function from AppContext that talks to the database
  const { bookings, cancelBooking, chargers, reviews } = useApp();
  
  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("All");
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null); // To open the Review popup
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null); // To open the "Are you sure?" popup
  const [chatCharger, setChatCharger] = useState<{
    id: string;
    title: string;
    ownerId: string;
    ownerName: string;
    ownerAvatar: string;
  } | null>(null);

  // --- FILTERING ---
  // If "All" is selected, show everything. Otherwise, only show matches.
  const filtered =
    activeTab === "All"
      ? bookings
      : bookings.filter(
          (b) => b.status === activeTab.toLowerCase()
        );

  // --- STYLE CONFIGURATION ---
  // Depending on the status, we change the color and icon of the status badge.
  const statusConfig = {
    upcoming: {
      color: "bg-blue-50 text-blue-600 border-blue-100",
      accent: "border-l-blue-500",
      icon: Calendar,
      label: "Upcoming",
    },
    active: {
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      accent: "border-l-emerald-500",
      icon: Zap,
      label: "Charging Now",
    },
    completed: {
      color: "bg-slate-100 text-slate-500 border-slate-200",
      accent: "border-l-slate-300",
      icon: CheckCircle,
      label: "Finished",
    },
    cancelled: {
      color: "bg-red-50 text-red-500 border-red-100",
      accent: "border-l-red-400",
      icon: XCircle,
      label: "Cancelled",
    },
  };

  return (
    <div className="pb-4 bg-slate-50 min-h-full">
      
      {/* ─── DARK HERO HEADER ─── */}
      <div className="header-gradient px-5 pt-6 pb-5">
        <h1 className="text-white text-[1.3rem]" style={{ fontWeight: 700, fontSize: '1.3rem', lineHeight: 1.2 }}>My Bookings</h1>
        <p className="text-white/40 text-[0.8rem] mt-1 font-medium">
          {bookings.length} total sessions • {bookings.filter(b => b.status === 'active').length} active
        </p>
      </div>

      {/* ─── TABS (HORIZONTAL SCROLL) ─── */}
      <div className="flex gap-2 px-4 py-3 -mt-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          // Calculate count per tab to show to the user (e.g. "Completed (5)")
          const count =
            tab === "All"
              ? bookings.length
              : bookings.filter(
                  (b) => b.status === tab.toLowerCase()
                ).length;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              // whitespace-nowrap: prevents the tab text from wrapping to a second line
              className={`px-3.5 py-2 rounded-xl text-[0.75rem] whitespace-nowrap transition-all font-semibold border ${
                activeTab === tab
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/15"
                  : "bg-white text-slate-500 border-slate-100 shadow-sm"
              }`}
            >
              {tab} <span className="opacity-60 ml-0.5">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ─── BOOKING LIST ─── */}
      {filtered.length === 0 ? (
        // Empty State: showing this if there's nothing to list
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-4">
            <Calendar className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-600 font-semibold">No bookings found</p>
          <p className="text-slate-400 text-[0.8rem] mt-1">This category is empty</p>
          <button
            onClick={() => navigate("/")}
            className="mt-5 px-6 py-2.5 bg-primary text-white rounded-xl text-[0.85rem] font-bold shadow-md shadow-primary/15"
          >
            Find Chargers
          </button>
        </div>
      ) : (
        // space-y-3: adds even space between every card automatically
        <div className="px-4 py-2 space-y-3">
          {filtered.map((booking) => {
            const config = statusConfig[booking.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={booking.id}
                className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden border-l-[3px] ${config.accent}`}
              >
                {/* Upper Half: Image + Basic Info */}
                <div className="flex gap-3.5 p-3.5">
                  <div className="w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                    <ImageWithFallback
                      src={booking.chargerImage}
                      alt={booking.chargerTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[0.875rem] font-bold text-slate-900 truncate">
                        {booking.chargerTitle}
                      </h3>
                      {/* The Status Badge */}
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[0.6rem] uppercase tracking-wider font-bold border flex-shrink-0 ${config.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-slate-400 mt-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="text-[0.7rem] truncate font-medium">
                        {booking.chargerAddress}
                      </span>
                    </div>
                    
                    {/* Date and Time Row */}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[0.7rem] text-slate-500 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {booking.date}
                      </span>
                      <span className="text-[0.7rem] text-slate-500 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {booking.startTime} - {booking.endTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Bar (Connector, Power, Cost) */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 border-t border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[0.65rem] text-slate-500 font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-100">
                      {booking.connectorType.replace("Wall Connector", "")}
                    </span>
                    <span className="text-[0.65rem] text-slate-500 font-semibold flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-slate-100">
                      <Zap className="w-3 h-3 text-slate-400" />
                      {booking.power} kW
                    </span>
                  </div>
                  <span className="text-[0.95rem] text-primary font-black">
                    ₹{booking.totalCost}
                  </span>
                </div>

                {/* ACTION BUTTONS (Contextual) */}
                
                {/* 1. Upcoming: Show View Details & Cancel */}
                {booking.status === "upcoming" && (
                  <div className="flex gap-2 px-3.5 pb-3.5 pt-1">
                    <button
                      onClick={() => navigate(`/charger/${booking.chargerId}`)}
                      className="flex-1 py-2 text-[0.75rem] font-semibold border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
                    >
                      View Station
                    </button>
                    <button
                      onClick={() => {
                        const charger = chargers.find((c) => c.id === booking.chargerId);
                        if (!charger) return;
                        setChatCharger({
                          id: charger.id,
                          title: charger.title,
                          ownerId: charger.ownerId,
                          ownerName: charger.ownerName,
                          ownerAvatar: charger.ownerAvatar,
                        });
                      }}
                      className="flex-1 py-2 text-[0.75rem] font-semibold border border-primary/20 text-primary rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Chat
                    </button>
                    <button
                      onClick={() => setCancelConfirm(booking.id)}
                      className="flex-1 py-2 text-[0.75rem] font-semibold border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* 2. Active: Show a circular progress indicator */}
                {booking.status === "active" && (
                  <div className="px-3.5 pb-3.5 pt-2">
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100/50">
                      {/* Circular Progress Ring */}
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#d1fae5" strokeWidth="3" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="3"
                            strokeDasharray="88" strokeDashoffset={88 - (88 * 72 / 100)}
                            strokeLinecap="round" className="transition-all duration-1000"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[0.6rem] font-black text-emerald-700">72%</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-[0.7rem] text-emerald-700 font-bold uppercase tracking-wider">Charging Live</p>
                        <p className="text-[0.65rem] text-emerald-600/60 mt-0.5 font-medium">Estimated 45 min remaining</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Completed: Show Leave Review */}
                {booking.status === "completed" && (
                  <div className="flex gap-2 px-3.5 pb-3.5 pt-1">
                    {reviews.some((r) => r.bookingId === booking.id) ? (
                      <div className="flex-1 py-2 text-[0.75rem] font-bold bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Rated
                      </div>
                    ) : (
                      <button
                        onClick={() => setReviewBooking(booking)}
                        className="flex-1 py-2 text-[0.75rem] font-bold bg-primary text-white rounded-xl shadow-sm shadow-primary/10 flex items-center justify-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        Rate Experience
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/charger/${booking.chargerId}`)}
                      className="flex-1 py-2 text-[0.75rem] font-semibold border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
                    >
                      Book Again
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── CANCEL CONFIRMATION POPUP ─── */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setCancelConfirm(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-[1.1rem] font-bold text-slate-900">Cancel Booking?</h3>
            <p className="text-[0.85rem] text-slate-500 mt-2">
              You will receive a full refund in your wallet.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setCancelConfirm(null)}
                className="flex-1 py-2.5 border border-slate-100 rounded-xl text-[0.85rem] font-semibold text-slate-400"
              >
                Keep it
              </button>
              <button
                onClick={async () => {
                  if (cancelConfirm) {
                    try {
                      await cancelBooking(cancelConfirm);
                      toast.success("Booking cancelled successfully!");
                      setCancelConfirm(null);
                    } catch (error: any) {
                      toast.error(error.message || "Failed to cancel booking");
                    }
                  }
                }}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-[0.85rem] font-bold shadow-md shadow-red-500/15"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show the Review popup if a completed booking was clicked */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
        />
      )}

      {chatCharger && (
        <ChatModal
          charger={chatCharger}
          onClose={() => setChatCharger(null)}
        />
      )}
    </div>
  );
}