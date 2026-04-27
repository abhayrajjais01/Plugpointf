import { lazy, Suspense, useState } from "react";
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
  Wifi,
  Coffee,
  Camera,
  ParkingSquare,
  Sun,
  Dog,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { StarRating } from "./StarRating";
import { ChatModal } from "./ChatModal";

const BookingModal = lazy(() => import("./BookingModal").then((m) => ({ default: m.BookingModal })));

// Amenity icons mapping
const amenityIcons: Record<string, any> = {
  "WiFi Nearby": Wifi,
  "Covered Parking": ParkingSquare,
  "Coffee Shop Nearby": Coffee,
  "Security Camera": Camera,
  "Well Lit": Sun,
  "Pet Friendly": Dog,
  "CCTV": Camera,
  "Restroom": Info,
  "Restroom Nearby": Info,
  "Gated Access": Shield,
  "Underground Parking": ParkingSquare,
  "Street Parking": ParkingSquare,
  "Private Driveway": ParkingSquare,
  "Parks Nearby": Sun,
  "Scenic View": Sun,
  "Quiet Area": Sun,
  "Elevator Access": Info,
  "Security": Shield,
  "EV Friendly Building": Zap,
  "Tech Park Access": Info,
  "Garage Parking": ParkingSquare,
  "Public Access": Info,
  "On Route": MapPin,
};

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
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-slate-300" />
        </div>
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
          className="w-full h-full object-cover"
        />
        {/* Dark gradient at the top so the white back button is visible */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />
        
        {/* Back Button (Floating) */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-slate-900" />
        </button>

        {/* Action Buttons (Share & Favorite) */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <Share2 className="w-5 h-5 text-slate-900" />
          </button>
          <button
            onClick={() => setLiked(!liked)}
            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${liked ? "text-red-500 fill-red-500" : "text-slate-900"}`}
            />
          </button>
        </div>

        {/* Availability Badge (Bottom Left of Image) */}
        {charger.available ? (
          <span className="absolute bottom-4 left-4 px-3.5 py-1.5 bg-emerald-500 text-white text-[0.65rem] uppercase tracking-widest font-black rounded-lg shadow-lg flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Available Now
          </span>
        ) : (
          <span className="absolute bottom-4 left-4 px-3.5 py-1.5 bg-slate-600 text-white text-[0.65rem] uppercase tracking-widest font-black rounded-lg shadow-lg">
            Currently Unavailable
          </span>
        )}
      </div>

      {/* ─── CONTENT SECTION ─── */}
      <div className="px-5 pt-5 space-y-5">
        
        {/* Title and Rating Bar */}
        <div className="flex flex-col gap-2">
          <h1 className="text-[1.4rem] font-black text-slate-900 leading-tight" style={{ fontSize: '1.4rem' }}>
            {charger.title}
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
               <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
               <span className="text-[0.8rem] font-bold text-amber-700">{charger.rating}</span>
            </div>
            <span className="text-[0.75rem] text-slate-400 font-medium">
              ({charger.reviewCount} reviews)
            </span>
            {charger.verified && (
              <span className="flex items-center gap-1 text-[0.7rem] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                <Shield className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
        </div>

        {/* Location Row */}
        <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0">
             <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.85rem] font-bold text-slate-900">{charger.address}</p>
            <p className="text-[0.7rem] text-slate-400 font-medium mt-0.5">{charger.city}</p>
          </div>
          <button className="text-[0.75rem] text-primary font-bold hover:underline flex-shrink-0">
            Directions
          </button>
        </div>

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon: Zap, label: "Power", value: `${charger.power} kW`, bg: "bg-primary/8", iconColor: "text-primary" },
            { icon: Info, label: "Plug Type", value: charger.connectorType, bg: "bg-blue-500/8", iconColor: "text-blue-500" },
            { icon: Clock, label: "Hours", value: charger.availableHours.length > 15 ? charger.availableHours.substring(0, 15) + '…' : charger.availableHours, bg: "bg-amber-500/8", iconColor: "text-amber-500" },
            { icon: DollarSign, label: "Per kWh", value: `₹${charger.pricePerKwh}`, bg: "bg-emerald-500/8", iconColor: "text-emerald-500" },
          ].map(({ icon: Icon, label, value, bg, iconColor }) => (
            <div key={label} className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                 <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[0.6rem] text-slate-400 uppercase font-bold tracking-wider">{label}</p>
                <p className="text-[0.85rem] font-bold text-slate-900 truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Amenities */}
        {charger.amenities && charger.amenities.length > 0 && (
          <div>
            <h2 className="text-[1rem] font-bold text-slate-900 mb-2.5">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {charger.amenities.map((amenity) => {
                const IconComp = amenityIcons[amenity] || Info;
                return (
                  <div key={amenity} className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-[0.75rem] font-medium text-slate-600">
                    <IconComp className="w-3.5 h-3.5 text-slate-400" />
                    {amenity}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <h2 className="text-[1rem] font-bold text-slate-900 mb-2">About this Station</h2>
          <p className="text-[0.85rem] text-slate-600 leading-relaxed">{charger.description}</p>
        </div>

        {/* Host Info */}
        <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <img src={charger.ownerAvatar} alt={charger.ownerName} className="w-11 h-11 rounded-full border-2 border-white shadow-sm" />
          <div className="flex-1">
            <p className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-wider">Hosted by</p>
            <p className="text-[0.9rem] font-bold text-slate-900">{charger.ownerName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[0.7rem] font-semibold text-slate-500">{charger.ownerRating} rating</span>
            </div>
          </div>
          {(!user || charger.ownerId !== user.id) && (
            <button onClick={() => setShowChat(true)} className="px-3 py-2 border border-primary text-primary rounded-xl text-[0.75rem] font-bold hover:bg-primary/5 transition-colors flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> Chat
            </button>
          )}
        </div>

        {/* REVIEWS SECTION */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[1rem] font-bold text-slate-900">Reviews</h2>
            {chargerReviews.length > 3 && (
              <button
                 onClick={() => setShowAllReviews(!showAllReviews)}
                 className="text-[0.75rem] text-primary font-bold"
              >
                 {showAllReviews ? "Show Less" : `See All (${chargerReviews.length})`}
              </button>
            )}
          </div>

          {chargerReviews.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
              <Star className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-[0.8rem] font-medium">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedReviews.map((review) => (
                <div key={review.id} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <img src={review.userAvatar} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
                    <div className="flex-1">
                      <p className="text-[0.8rem] font-bold text-slate-900">{review.userName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StarRating rating={review.rating} size={10} />
                        <span className="text-[0.65rem] text-slate-400 font-medium">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[0.8rem] text-slate-600 leading-relaxed">"{review.comment}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── FLOATING BOOKING BAR ─── */}
      {/* fixed bottom-0: attaches directly to the App.tsx bounds because it uses transform translate-x-0 */}
      <div className="fixed bottom-0 left-0 w-full p-3.5 bg-white/95 backdrop-blur-xl border-t border-slate-100 z-[30]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <p className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-wider">Price</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[1.2rem] font-black text-slate-900">₹{charger.pricePerHour}</span>
              <span className="text-[0.75rem] text-slate-400 font-semibold">/ hour</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(!user || charger.ownerId !== user.id) && (
              <button
                onClick={() => setShowChat(true)}
                className="w-12 h-12 border-2 border-primary/20 rounded-xl flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => setShowBooking(true)}
              className="h-12 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 px-6"
            >
              <Calendar className="w-4.5 h-4.5" />
              Reserve Now
            </button>
          </div>
        </div>
      </div>

      {/* The actual Booking Wizard (opens when button is clicked) */}
      {showBooking && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 text-white text-sm font-bold">
            Loading booking...
          </div>
        }>
          <BookingModal
            charger={charger}
            onClose={() => setShowBooking(false)}
          />
        </Suspense>
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
