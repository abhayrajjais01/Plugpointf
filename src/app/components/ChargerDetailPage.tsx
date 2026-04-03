import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  MapPin,
  Zap,
  Clock,
  Shield,
  Star,
  Share2,
  Heart,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  ThumbsUp,
  Calendar,
  DollarSign,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { StarRating } from "./StarRating";
import { BookingModal } from "./BookingModal";
import { ChatModal } from "./ChatModal";

/**
 * --- CHARGER DETAIL PAGE ---
 * This page shows everything about a single charging station.
 * It uses the 'ID' from the URL (e.g. /charger/c1) to find the data.
 */
export function ChargerDetailPage() {
  const { id } = useParams(); // useParams grabs the "c1" or "c2" from the URL
  const navigate = useNavigate();
  
  // We pull all chargers and reviews from our global AppContext
  const { chargers, reviews, user } = useApp();
  
  // --- UI STATE ---
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showBooking, setShowBooking] = useState(false); // Controls the Booking Modal popup
  const [showChat, setShowChat] = useState(false);
  const [liked, setLiked] = useState(false);

  // --- DATA LOOKUP ---
  const charger = chargers.find((c) => c.id === id);

  // If the ID is wrong or the charger doesn't exist, show an error.
  if (!charger) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
        <AlertCircle className="w-16 h-16 text-slate-200 mb-4" />
        <h2 className="text-[1.25rem] font-bold text-slate-900">Charger not found</h2>
        <p className="text-slate-500 mt-2">The link might be broken or the charger was removed.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 px-8 py-3 bg-primary text-white rounded-xl text-[0.875rem] font-bold shadow-lg"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // Filter reviews to only show the ones for THIS charger
  const chargerReviews = reviews.filter((r) => r.chargerId === charger.id);
  const displayedReviews = showAllReviews
    ? chargerReviews
    : chargerReviews.slice(0, 3); // Only show the top 3 reviews initially

  return (
    // pb-24: adds extra bottom padding so the floating "Book" bar doesn't cover text
    <div className="pb-24 bg-white min-h-screen">
      
      {/* ─── HEADER IMAGE ─── */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        <ImageWithFallback
          src={charger.image}
          alt={charger.title}
          className="w-full h-full object-cover shadow-inner"
        />
        {/* Dark gradient at the top so the white back button is visible */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        
        {/* Back Button (Floating) */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-slate-900" />
        </button>

        {/* Action Buttons (Share & Favorite) */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <Share2 className="w-5 h-5 text-slate-900" />
          </button>
          <button
            onClick={() => setLiked(!liked)}
            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <Heart
              className={`w-5 h-5 ${liked ? "text-red-500 fill-red-500" : "text-slate-900"}`}
            />
          </button>
        </div>

        {/* Availability Badge (Bottom Left of Image) */}
        {charger.available ? (
          <span className="absolute bottom-4 left-4 px-4 py-1.5 bg-emerald-500 text-white text-[0.7rem] uppercase tracking-widest font-black rounded-full shadow-lg">
            Available Now
          </span>
        ) : (
          <span className="absolute bottom-4 left-4 px-4 py-1.5 bg-slate-500 text-white text-[0.7rem] uppercase tracking-widest font-black rounded-full shadow-lg">
            Currently Unavailable
          </span>
        )}
      </div>

      {/* ─── CONTENT SECTION ─── */}
      <div className="px-5 pt-6 space-y-6">
        
        {/* Title and Rating Bar */}
        <div className="flex flex-col gap-2">
          <h1 className="text-[1.5rem] font-black text-slate-900 leading-tight">
            {charger.title}
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
               <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
               <span className="text-[0.8rem] font-bold text-amber-700">{charger.rating}</span>
            </div>
            <span className="text-[0.8rem] text-slate-400 font-medium">
              ({charger.reviewCount} verified reviews)
            </span>
          </div>
        </div>

        {/* Location Row */}
        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
             <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-[0.875rem] font-bold text-slate-900">{charger.address}</p>
            <p className="text-[0.75rem] text-slate-500 font-medium">{charger.city}</p>
          </div>
          <button className="text-[0.8rem] text-primary font-bold hover:underline">
            View on Map
          </button>
        </div>

        {/* Technical Specs (Fast Charge, Plug Type, etc.) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
               <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[0.65rem] text-slate-400 uppercase font-black tracking-widest">Power</p>
              <p className="text-[0.9rem] font-bold text-slate-900">{charger.power} kW</p>
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
               <Info className="w-5 h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.65rem] text-slate-400 uppercase font-black tracking-widest">Plug Type</p>
              <p className="text-[0.9rem] font-bold text-slate-900 truncate">{charger.connectorType}</p>
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div>
          <h2 className="text-[1.125rem] font-black text-slate-900 mb-2">About this Station</h2>
          <p className="text-[0.9rem] text-slate-600 leading-relaxed font-medium">
            {charger.description}
          </p>
        </div>

        {/* REVIEWS SECTION */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[1.125rem] font-black text-slate-900">User Experience</h2>
            <button
               onClick={() => setShowAllReviews(!showAllReviews)}
               className="text-[0.8rem] text-primary font-bold"
            >
               {showAllReviews ? "Show Less" : `See All (${chargerReviews.length})`}
            </button>
          </div>

          <div className="space-y-4">
            {displayedReviews.map((review) => (
              <div key={review.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <img src={review.userAvatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                  <div className="flex-1">
                    <p className="text-[0.85rem] font-bold text-slate-900">{review.userName}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      <StarRating rating={review.rating} size={10} />
                    </div>
                  </div>
                  <span className="text-[0.7rem] text-slate-400 font-medium">{review.date}</span>
                </div>
                <p className="text-[0.85rem] text-slate-600 font-medium italic">"{review.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── FLOATING BOOKING BAR ─── */}
      {/* fixed bottom-0: sticks to the bottom of the screen regardless of scroll position */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 backdrop-blur-lg bg-white/90 z-[30]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <p className="text-[0.7rem] text-slate-400 font-black uppercase tracking-widest">Total Price</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[1.25rem] font-black text-slate-900">₹{charger.pricePerHour}</span>
              <span className="text-[0.8rem] text-slate-400 font-bold">/ hour</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && charger.ownerId !== user.id && (
              <button
                onClick={() => setShowChat(true)}
                className="w-14 h-14 border-2 border-primary rounded-2xl flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
              </button>
            )}

            <button
              onClick={() => setShowBooking(true)}
              className="flex-1 h-14 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 px-6"
            >
              <Calendar className="w-5 h-5 fill-white/20" />
              Reserve Now
            </button>
          </div>
        </div>
      </div>

      {/* The actual Booking Wizard (opens when button is clicked) */}
      {showBooking && (
        <BookingModal
          charger={charger}
          onClose={() => setShowBooking(false)}
        />
      )}
      
      {showChat && (
        <ChatModal
          charger={{
            id: charger.id,
            title: charger.title,
            ownerId: charger.ownerId,
            ownerName: charger.ownerName,
            ownerAvatar: charger.ownerAvatar,
          }}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}