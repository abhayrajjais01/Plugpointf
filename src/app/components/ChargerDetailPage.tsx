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

export function ChargerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { chargers, reviews } = useApp();
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [liked, setLiked] = useState(false);

  const charger = chargers.find((c) => c.id === id);
  if (!charger) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Charger not found</p>
        <button
          onClick={() => navigate("/")}
          className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-[0.875rem]"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const chargerReviews = reviews.filter((r) => r.chargerId === charger.id);
  const displayedReviews = showAllReviews
    ? chargerReviews
    : chargerReviews.slice(0, 3);

  return (
    <div className="pb-24">
      {/* Header Image */}
      <div className="relative h-56">
        <ImageWithFallback
          src={charger.image}
          alt={charger.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-3 left-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="absolute top-3 right-3 flex gap-2">
          <button className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLiked(!liked)}
            className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
          >
            <Heart
              className={`w-4 h-4 ${liked ? "text-red-500 fill-red-500" : ""}`}
            />
          </button>
        </div>
        {charger.available ? (
          <span className="absolute bottom-3 left-3 px-3 py-1 bg-emerald-500 text-white text-[0.75rem] rounded-full" style={{ fontWeight: 500 }}>
            Available Now
          </span>
        ) : (
          <span className="absolute bottom-3 left-3 px-3 py-1 bg-gray-500 text-white text-[0.75rem] rounded-full" style={{ fontWeight: 500 }}>
            Currently Unavailable
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {/* Title & Rating */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[1.25rem]" style={{ fontWeight: 700 }}>{charger.title}</h1>
              {charger.verified && (
                <Shield className="w-5 h-5 text-primary flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-[0.8125rem]">
                {charger.address}, {charger.city}
              </span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-4 mt-3">
          <StarRating
            rating={charger.rating}
            size={16}
            count={charger.reviewCount}
          />
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex items-center gap-2.5 p-3 bg-secondary rounded-xl">
            <Zap className="w-5 h-5 text-primary" />
            <div>
              <p className="text-[0.6875rem] text-muted-foreground">Power</p>
              <p className="text-[0.875rem]" style={{ fontWeight: 600 }}>{charger.power} kW</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 bg-secondary rounded-xl">
            <Info className="w-5 h-5 text-primary" />
            <div>
              <p className="text-[0.6875rem] text-muted-foreground">Connector</p>
              <p className="text-[0.875rem]" style={{ fontWeight: 600 }}>{charger.connectorType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 bg-secondary rounded-xl">
            <DollarSign className="w-5 h-5 text-primary" />
            <div>
              <p className="text-[0.6875rem] text-muted-foreground">Per Hour</p>
              <p className="text-[0.875rem]" style={{ fontWeight: 600 }}>
                ₹{charger.pricePerHour}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 bg-secondary rounded-xl">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-[0.6875rem] text-muted-foreground">Hours</p>
              <p className="text-[0.875rem]" style={{ fontWeight: 600 }}>
                {charger.availableHours.split(",")[0]}
              </p>
            </div>
          </div>
        </div>

        {/* Price Info */}
        <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-600" />
            <span className="text-[0.8125rem]" style={{ fontWeight: 600 }}>Pricing Details</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[0.8125rem] text-muted-foreground">
              Per Hour
            </span>
            <span className="text-[0.875rem]" style={{ fontWeight: 600 }}>
              ₹{charger.pricePerHour}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[0.8125rem] text-muted-foreground">
              Per kWh
            </span>
            <span className="text-[0.875rem]" style={{ fontWeight: 600 }}>
              ₹{charger.pricePerKwh}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1 pt-1 border-t border-amber-200">
            <span className="text-[0.8125rem] text-muted-foreground">
              Service Fee
            </span>
            <span className="text-[0.875rem]" style={{ fontWeight: 600 }}>₹10</span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <h3 className="text-[0.9375rem] mb-2" style={{ fontWeight: 600 }}>About this Charger</h3>
          <p className="text-[0.8125rem] text-muted-foreground leading-relaxed">
            {charger.description}
          </p>
        </div>

        {/* Amenities */}
        <div className="mt-4">
          <h3 className="text-[0.9375rem] mb-2" style={{ fontWeight: 600 }}>Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {charger.amenities.map((a) => (
              <span
                key={a}
                className="flex items-center gap-1 px-2.5 py-1 bg-muted rounded-lg text-[0.75rem] text-muted-foreground"
              >
                <CheckCircle2 className="w-3 h-3 text-primary" />
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-[0.8125rem]" style={{ fontWeight: 600 }}>Charging Instructions</span>
          </div>
          <p className="text-[0.8125rem] text-muted-foreground leading-relaxed">
            {charger.instructions}
          </p>
        </div>

        {/* Host Info */}
        <div className="mt-4 p-3 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <img
              src={charger.ownerAvatar}
              alt={charger.ownerName}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[0.9375rem]" style={{ fontWeight: 600 }}>
                  {charger.ownerName}
                </span>
                <Shield className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[0.75rem] text-muted-foreground">
                  {charger.ownerRating} host rating
                </span>
              </div>
            </div>
            <button className="px-3 py-1.5 border border-border rounded-lg text-[0.8125rem] flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="w-3.5 h-3.5" />
              Chat
            </button>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[0.9375rem]" style={{ fontWeight: 600 }}>
              Reviews ({chargerReviews.length})
            </h3>
          </div>
          {displayedReviews.length === 0 ? (
            <p className="text-[0.8125rem] text-muted-foreground text-center py-6">
              No reviews yet. Be the first to review!
            </p>
          ) : (
            <div className="space-y-3">
              {displayedReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-3 bg-card rounded-xl border border-border"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={review.userAvatar}
                      alt={review.userName}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-[0.8125rem]" style={{ fontWeight: 600 }}>
                        {review.userName}
                      </p>
                      <p className="text-[0.6875rem] text-muted-foreground">
                        {review.date}
                      </p>
                    </div>
                    <StarRating
                      rating={review.rating}
                      size={12}
                      showValue={false}
                    />
                  </div>
                  <p className="text-[0.8125rem] text-muted-foreground mt-2 leading-relaxed">
                    {review.comment}
                  </p>
                  <button className="flex items-center gap-1 mt-2 text-[0.75rem] text-muted-foreground hover:text-foreground transition-colors">
                    <ThumbsUp className="w-3 h-3" />
                    Helpful ({review.helpful})
                  </button>
                </div>
              ))}
            </div>
          )}
          {chargerReviews.length > 3 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="flex items-center gap-1 mx-auto mt-3 text-[0.8125rem] text-primary"
            >
              {showAllReviews ? (
                <>
                  Show Less <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Show All Reviews <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bottom Booking Bar */}
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-full max-w-lg z-40 bg-white border border-border px-4 py-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] rounded-t-3xl md:rounded-3xl md:mb-2">
        <div className="flex items-center justify-between mx-auto">
          <div>
            <span className="text-[1.25rem] text-primary" style={{ fontWeight: 700 }}>
              ₹{charger.pricePerHour}
            </span>
            <span className="text-[0.8125rem] text-muted-foreground"> / hour</span>
          </div>
          <button
            onClick={() => setShowBooking(true)}
            disabled={!charger.available}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[0.9375rem] transition-colors ${
              charger.available
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Calendar className="w-4 h-4" />
            {charger.available ? "Book Now" : "Unavailable"}
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <BookingModal
          charger={charger}
          onClose={() => setShowBooking(false)}
        />
      )}
    </div>
  );
}