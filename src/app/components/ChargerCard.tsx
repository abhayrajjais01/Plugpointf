import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { MapPin, Zap, Clock, Shield, Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { StarRating } from "./StarRating";
import type { Charger } from "../../types";

interface ChargerCardProps {
  charger: Charger;
  variant?: "grid" | "list"; // The card can look like a vertical box (grid) or a horizontal row (list)
}

/**
 * --- THE CHARGER CARD ---
 * This is a reusable component that draws a single "Charger" on the screen.
 * Whether it's on the home page list or the search results, this same code is used!
 */
export function ChargerCard({ charger, variant = "grid" }: ChargerCardProps) {
  const navigate = useNavigate();

  // --- VARIANT 1: THE HORIZONTAL LIST ITEM ---
  // used mainly when multiple chargers are packed together in a tight space
  if (variant === "list") {
    return (
      <motion.button
        whileHover={{ scale: 1.01, x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate(`/charger/${charger.id}`)}
        className="flex gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left w-full"
      >
        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
          <ImageWithFallback
            src={charger.image}
            alt={charger.title}
            className="w-full h-full object-cover"
          />
          {!charger.available && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
              <span className="text-white text-[0.6rem] uppercase tracking-widest font-black">Busy</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[0.875rem] font-bold text-slate-800 truncate">{charger.title}</h3>
              {charger.verified && (
                <Shield className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 text-slate-400 mt-0.5">
              <MapPin className="w-3 h-3" />
              <span className="text-[0.7rem] truncate font-medium">{charger.address}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-auto">
            <StarRating rating={charger.rating} size={10} count={charger.reviewCount} />
            <span className="text-[0.875rem] text-primary font-black">
              ₹{charger.pricePerHour}
            </span>
          </div>
        </div>
      </motion.button>
    );
  }

  // --- VARIANT 2: THE LARGE VERTICAL CARD ---
  // used on the Home Page for a premium, high-impact look
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/charger/${charger.id}`)}
      // group: this special Tailwind class lets us trigger animations on children 
      // when the parent is hovered (e.g., zoom the image when we hover the card)
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 text-left w-full flex flex-col group overflow-hidden card-lift"
    >
      {/* The Image Wrapper */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden">
        <ImageWithFallback
          src={charger.image}
          alt={charger.title}
          // group-hover:scale-105: zooms the image slightly when you hover anywhere on the card
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        {/* A soft dark gradient at the bottom makes the price/status pop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
        
        {/* Status Badge */}
        {charger.available ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-emerald-500 text-white text-[0.6rem] uppercase tracking-widest font-black rounded-lg shadow-md">
            Available
          </span>
        ) : (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-slate-500/90 backdrop-blur-sm text-white text-[0.6rem] uppercase tracking-widest font-black rounded-lg shadow-md">
            Occupied
          </span>
        )}

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
          <span className="text-[0.7rem] font-bold text-slate-800">{charger.rating}</span>
        </div>
        
        {/* Price Badge */}
        <div className="absolute bottom-3 right-3">
          <span className="text-white text-[1.1rem] font-black">₹{charger.pricePerHour}</span>
          <span className="text-white/70 text-[0.7rem] font-bold ml-0.5">/hr</span>
        </div>
      </div>

      {/* The Content Area */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-[1rem] text-slate-900 font-bold leading-tight">{charger.title}</h3>

        {/* Location Row */}
        <div className="flex items-center gap-1.5 text-slate-400 mt-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
          <span className="text-[0.75rem] truncate font-medium">{charger.address}, {charger.city}</span>
        </div>

        {/* Tech Specs (Pills) */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className="inline-flex items-center gap-1 text-[0.7rem] px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg font-semibold border border-slate-100">
            <Zap className="w-3 h-3 text-primary" />
            {charger.power} kW
          </span>
          <span className="inline-flex items-center gap-1 text-[0.7rem] px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg font-semibold border border-blue-100">
            {charger.connectorType}
          </span>
          {charger.verified && (
            <span className="inline-flex items-center gap-1 text-[0.7rem] px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-semibold border border-emerald-100">
              <Shield className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>

        {/* The Host section (at the very bottom) */}
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <img
                  src={charger.ownerAvatar}
                  alt={charger.ownerName}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
                <div className="flex flex-col text-left">
                    <span className="text-[0.6rem] text-slate-400 font-semibold uppercase tracking-wider leading-none mb-0.5">Hosted by</span>
                    <span className="text-[0.8rem] font-bold text-slate-700 leading-none">{charger.ownerName}</span>
                </div>
            </div>
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
               <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-white transition-colors" />
            </div>
        </div>
      </div>
    </motion.button>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
    </svg>
  );
}