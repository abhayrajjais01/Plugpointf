import { useNavigate } from "react-router";
import { MapPin, Zap, Clock, Shield, Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { StarRating } from "./StarRating";
import type { Charger } from "../data/mock-data";

interface ChargerCardProps {
  charger: Charger;
  variant?: "grid" | "list";
}

export function ChargerCard({ charger, variant = "grid" }: ChargerCardProps) {
  const navigate = useNavigate();

  if (variant === "list") {
    return (
      <button
        onClick={() => navigate(`/charger/${charger.id}`)}
        className="flex gap-3 p-3 bg-card rounded-xl border border-border hover:shadow-md transition-shadow text-left w-full"
      >
        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
          <ImageWithFallback
            src={charger.image}
            alt={charger.title}
            className="w-full h-full object-cover"
          />
          {!charger.available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-[0.6875rem]" style={{ fontWeight: 600 }}>Unavailable</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[0.9375rem] truncate" style={{ fontWeight: 600 }}>{charger.title}</h3>
            {charger.verified && (
              <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            )}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3" />
            <span className="text-[0.75rem] truncate">{charger.address}, {charger.city}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1 text-[0.75rem] text-muted-foreground">
              <Zap className="w-3 h-3" />
              {charger.power} kW
            </div>
            <span className="text-[0.75rem] text-muted-foreground">{charger.connectorType}</span>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <StarRating rating={charger.rating} size={12} count={charger.reviewCount} />
            <span className="text-[0.875rem] text-primary" style={{ fontWeight: 700 }}>
              ₹{charger.pricePerHour}/hr
            </span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(`/charger/${charger.id}`)}
      className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all duration-300 text-left w-full flex flex-col group overflow-hidden"
    >
      <div className="relative h-56 w-full shrink-0">
        <ImageWithFallback
          src={charger.image}
          alt={charger.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        {charger.available ? (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-emerald-500 text-white text-[0.6875rem] rounded-full" style={{ fontWeight: 500 }}>
            Available
          </span>
        ) : (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-gray-500 text-white text-[0.6875rem] rounded-full" style={{ fontWeight: 500 }}>
            Unavailable
          </span>
        )}
        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/60 text-white text-[0.75rem] rounded-full backdrop-blur-sm" style={{ fontWeight: 600 }}>
          ₹{charger.pricePerHour}/hr
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-[1.125rem] text-foreground" style={{ fontWeight: 700 }}>{charger.title}</h3>
          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg mt-0.5 shrink-0">
             <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
             <span className="text-[0.75rem]" style={{ fontWeight: 600 }}>{charger.rating}</span>
             <span className="text-[0.6875rem] text-amber-600 ml-0.5">({charger.reviewCount})</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="text-[0.875rem] truncate">{charger.address}, {charger.city}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 text-[0.8125rem] px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg" style={{ fontWeight: 600 }}>
            <Zap className="w-3.5 h-3.5" />
            {charger.power} kW
          </span>
          <span className="inline-flex items-center gap-1 text-[0.8125rem] px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg" style={{ fontWeight: 600 }}>
            {charger.connectorType}
          </span>
          {charger.verified && (
            <span className="inline-flex items-center gap-1 text-[0.8125rem] px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-lg" style={{ fontWeight: 600 }}>
              <Shield className="w-3.5 h-3.5" />
              Verified
            </span>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
                <img
                  src={charger.ownerAvatar}
                  alt={charger.ownerName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-background shadow-sm"
                />
                <div className="flex flex-col text-left">
                    <span className="text-[0.6875rem] text-muted-foreground leading-tight">Hosted by</span>
                    <span className="text-[0.8125rem] leading-tight text-foreground" style={{ fontWeight: 600 }}>{charger.ownerName}</span>
                </div>
            </div>
            <div className="text-right">
                <span className="text-[1.25rem] text-primary block leading-none" style={{ fontWeight: 700 }}>
                  ₹{charger.pricePerHour}
                </span>
                <span className="text-[0.75rem] text-muted-foreground ml-0.5">/hr</span>
            </div>
        </div>
      </div>
    </button>
  );
}