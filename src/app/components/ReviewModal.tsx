import { useState } from "react";
import { X, CheckCircle, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { StarRating } from "./StarRating";
import type { Booking } from "../data/mock-data";

interface ReviewModalProps {
  booking: Booking;
  onClose: () => void;
}

export function ReviewModal({ booking, onClose }: ReviewModalProps) {
  const { addReview, user } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user || !comment.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await addReview({
        chargerId: booking.chargerId,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        rating,
        comment: comment.trim(),
      });
      setSubmitted(true);
    } catch {
      setError("Failed to submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="w-5" />
          <h3 className="text-[0.9375rem]" style={{ fontWeight: 600 }}>
            {submitted ? "Thanks!" : "Leave a Review"}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-[1.125rem]" style={{ fontWeight: 700 }}>Review Submitted!</h2>
            <p className="text-[0.8125rem] text-muted-foreground mt-1">
              Thank you for your feedback. It helps the community!
            </p>
            <button onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-[0.875rem]">
              Done
            </button>
          </div>
        ) : (
          <div className="p-4">
            <div className="text-center mb-4">
              <p className="text-[0.8125rem] text-muted-foreground mb-2">How was your experience at</p>
              <p className="text-[0.9375rem]" style={{ fontWeight: 600 }}>{booking.chargerTitle}</p>
            </div>

            <div className="flex justify-center mb-4">
              <StarRating rating={rating} size={28} showValue={false} interactive onRate={setRating} />
            </div>

            <textarea value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience... (Was the charger easy to find? How was the charging speed?)"
              className="w-full h-28 p-3 border border-border rounded-xl text-[0.8125rem] resize-none bg-input-background outline-none focus:border-primary transition-colors" />

            {error && <p className="text-red-500 text-[0.8125rem] mt-2 text-center">{error}</p>}

            <button onClick={handleSubmit} disabled={!comment.trim() || loading}
              className={`w-full mt-3 py-3 rounded-xl text-[0.9375rem] flex items-center justify-center gap-2 transition-colors ${comment.trim() && !loading ? "bg-primary text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : "Submit Review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
