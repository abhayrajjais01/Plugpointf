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
  const { bookings, cancelBooking, chargers } = useApp();
  
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
      icon: Calendar,
      label: "Upcoming",
    },
    active: {
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      icon: Zap,
      label: "Charging Now",
    },
    completed: {
      color: "bg-slate-100 text-slate-500 border-slate-200",
      icon: CheckCircle,
      label: "Finished",
    },
    cancelled: {
      color: "bg-red-50 text-red-600 border-red-100",
      icon: XCircle,
      label: "Cancelled",
    },
  };

  return (
    <div className="pb-4 bg-slate-50 min-h-full">
      
      {/* ─── PAGE HEADER ─── */}
      <div className="px-4 pt-6 pb-4 bg-white border-b border-slate-100">
        <h1 className="text-[1.25rem] font-bold text-slate-900">My Bookings</h1>
        <p className="text-[0.8125rem] text-slate-400 mt-1 font-medium">
          Manage your current and past charging sessions
        </p>
      </div>

      {/* ─── TABS (HORIZONTAL SCROLL) ─── */}
      <div className="flex gap-2 px-4 py-4 overflow-x-auto no-scrollbar bg-white shadow-sm">
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
              className={`px-4 py-2 rounded-xl text-[0.75rem] whitespace-nowrap transition-all font-bold border ${
                activeTab === tab
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "bg-white text-slate-400 border-slate-100"
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
          <Calendar className="w-16 h-16 text-slate-200 mb-4" />
          <p className="text-slate-400 font-medium">No bookings found in this category</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-8 py-3 bg-primary text-white rounded-xl text-[0.875rem] font-bold shadow-lg"
          >
            Find Chargers
          </button>
        </div>
      ) : (
        // space-y-4: adds even space between every card automatically
        <div className="px-4 py-4 space-y-4">
          {filtered.map((booking) => {
            const config = statusConfig[booking.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Upper Half: Image + Basic Info */}
                <div className="flex gap-4 p-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                    <ImageWithFallback
                      src={booking.chargerImage}
                      alt={booking.chargerTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[0.9375rem] font-bold text-slate-900 truncate">
                        {booking.chargerTitle}
                      </h3>
                      {/* The Status Badge */}
                      <span
                        className={`flex items-center gap-1.2 px-2 py-0.5 rounded-lg text-[0.6rem] uppercase tracking-wider font-black border ${config.color}`}
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
                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="text-[0.7rem] text-slate-600 font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {booking.date}
                      </span>
                      <span className="text-[0.7rem] text-slate-600 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {booking.startTime} - {booking.endTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Bar (Connector, Power, Cost) */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-[0.7rem] text-slate-500 font-bold uppercase">
                      {booking.connectorType}
                    </span>
                    <span className="text-[0.7rem] text-slate-500 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-slate-300" />
                      {booking.power} kW
                    </span>
                  </div>
                  <span className="text-[1rem] text-primary font-black">
                    ₹{booking.totalCost}
                  </span>
                </div>

                {/* ACTION BUTTONS (Contextual) */}
                
                {/* 1. Upcoming: Show View Details & Cancel */}
                {booking.status === "upcoming" && (
                  <div className="flex gap-2 px-4 pb-4 pt-1">
                    <button
                      onClick={() => navigate(`/charger/${booking.chargerId}`)}
                      className="flex-1 py-2.5 text-[0.8rem] font-bold border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
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
                      className="flex-1 py-2.5 text-[0.8rem] font-bold border border-primary text-primary rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Chat Host
                    </button>
                    <button
                      onClick={() => setCancelConfirm(booking.id)}
                      className="flex-1 py-2.5 text-[0.8rem] font-bold border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* 2. Active: Show a progress bar simulation */}
                {booking.status === "active" && (
                  <div className="px-4 pb-4 pt-2">
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100/50">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1.5">
                           <p className="text-[0.7rem] text-emerald-700 font-black uppercase tracking-widest">
                            Charging Session Live
                           </p>
                           <span className="text-[0.8rem] text-emerald-700 font-black">72%</span>
                        </div>
                        {/* Progress Bar background */}
                        <div className="w-full bg-emerald-100/50 rounded-full h-1.5">
                          {/* Progress Bar level */}
                          <div className="bg-emerald-500 h-1.5 rounded-full w-[72%] shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Completed: Show Leave Review */}
                {booking.status === "completed" && (
                  <div className="flex gap-2 px-4 pb-4 pt-1">
                    <button
                      onClick={() => setReviewBooking(booking)}
                      className="flex-1 py-2.5 text-[0.8rem] font-bold bg-primary text-white rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
                    >
                      <Star className="w-3.5 h-3.5 fill-white" />
                      Rate Experience
                    </button>
                    <button
                      onClick={() => navigate(`/charger/${booking.chargerId}`)}
                      className="flex-1 py-2.5 text-[0.8rem] font-bold border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
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
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setCancelConfirm(null)} />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-[1.125rem] font-bold text-slate-900">Cancel Booking?</h3>
            <p className="text-[0.875rem] text-slate-500 mt-2">
              Are you sure you want to cancel? You will receive a full refund in your wallet.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCancelConfirm(null)}
                className="flex-1 py-3 border border-slate-100 rounded-2xl text-[0.875rem] font-bold text-slate-400"
              >
                Keep it
              </button>
              <button
                onClick={() => {
                  cancelBooking(cancelConfirm); // Tell the app to cancel this ID in the database
                  setCancelConfirm(null);
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-[0.875rem] font-bold shadow-lg shadow-red-500/20"
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