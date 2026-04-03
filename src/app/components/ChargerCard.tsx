import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { MapPin, Zap, Clock, Shield, Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { StarRating } from "./StarRating";
import type { Charger } from "../data/mock-data";

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
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/charger/${charger.id}`)}
      // group: this special Tailwind class lets us trigger animations on children 
      // when the parent is hovered (e.g., zoom the image when we hover the card)
      className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 text-left w-full flex flex-col group overflow-hidden"
    >
      {/* The Image Wrapper */}
      <div className="relative h-60 w-full shrink-0 overflow-hidden">
        <ImageWithFallback
          src={charger.image}
          alt={charger.title}
          // group-hover:scale-105: zooms the image slightly when you hover anywhere on the card
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        {/* A soft dark gradient at the bottom makes the price/status pop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
        
        {/* Status Badge */}
        {charger.available ? (
          <span className="absolute top-3 left-3 px-3 py-1 bg-emerald-500 text-white text-[0.65rem] uppercase tracking-widest font-black rounded-full shadow-lg">
            Available
          </span>
        ) : (
          <span className="absolute top-3 left-3 px-3 py-1 bg-slate-500 text-white text-[0.65rem] uppercase tracking-widest font-black rounded-full shadow-lg">
            Occupied
          </span>
        )}
        
        {/* Price Badge */}
        <div className="absolute bottom-3 right-3 px-3 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
           <span className="text-primary text-[1rem] font-black">₹{charger.pricePerHour}</span>
           <span className="text-slate-400 text-[0.7rem] font-bold ml-0.5">/hr</span>
        </div>
      </div>

      {/* The Content Area */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-[1.125rem] text-slate-900 font-black leading-tight">{charger.title}</h3>
          {/* Rating box */}
          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-xl shrink-0 border border-amber-100">
             <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
             <span className="text-[0.8rem] font-bold">{charger.rating}</span>
          </div>
        </div>

        {/* Location Row */}
        <div className="flex items-center gap-1.5 text-slate-400 mb-5">
          <MapPin className="w-4 h-4 text-primary/60 flex-shrink-0" />
          <span className="text-[0.8rem] truncate font-medium">{charger.address}, {charger.city}</span>
        </div>

        {/* Tech Specs (Pills) */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 text-[0.75rem] px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl font-bold border border-slate-100">
            <Zap className="w-3.5 h-3.5 text-primary" />
            {charger.power} kW
          </span>
          <span className="inline-flex items-center gap-1 text-[0.75rem] px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl font-bold border border-slate-100">
            {charger.connectorType}
          </span>
          {charger.verified && (
            <span className="inline-flex items-center gap-1.5 text-[0.75rem] px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold border border-emerald-100">
              <Shield className="w-3.5 h-3.5" />
              Verified
            </span>
          )}
        </div>

        {/* The Host section (at the very bottom) */}
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                <img
                  src={charger.ownerAvatar}
                  alt={charger.ownerName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-md"
                />
                <div className="flex flex-col text-left">
                    <span className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Hosted by</span>
                    <span className="text-[0.85rem] font-bold text-slate-800 leading-none">{charger.ownerName}</span>
                </div>
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
               <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
            </div>
        </div>
      </div>
    </motion.button>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
    </svg>
  );
}