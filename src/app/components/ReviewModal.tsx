import { useState } from "react";
import { X, CheckCircle, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { StarRating } from "./StarRating";
import type { Booking } from "../../types";

interface ReviewModalProps {
  booking: Booking;
  onClose: () => void;
}

/**
 * --- THE REVIEW MODAL ---
 * After a user finishes charging, we show them this popup.
 * It lets them pick a star rating (1-5) and write a comment 
 * about their experience.
 */
export function ReviewModal({ booking, onClose }: ReviewModalProps) {
  // We use addReview to save the feedback to Supabase
  const { addReview, user } = useApp();
  
  // --- UI STATE ---
  const [rating, setRating] = useState(5); // Default to 5 stars
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false); // Controls the "Thank You" screen
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This function runs when the user clicks 'Submit'
  const handleSubmit = async () => {
    // If they didn't write anything, don't let them submit
    if (!user || !comment.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      // Send the review data to our database helper
      await addReview({
        chargerId: booking.chargerId,
        bookingId: booking.id,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        rating,
        comment: comment.trim(),
      });
      // Show the green "Checkmark" success screen
      setSubmitted(true);
    } catch {
      setError("Oops! Failed to submit review. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // fixed inset-0: black background covers everything
    // flex items-end: causes the modal to slide up from the bottom on mobile
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      
      {/* The semi-transparent dark background */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* The actual Modal white box */}
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-5">
        
        {/* Header Block */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="w-5" />
          <h3 className="text-[1rem] font-black text-slate-900">
            {submitted ? "Success!" : "Rate Your Trip"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* CONDITION 1: SHOW SUCCESS MESSAGE */}
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-[1.25rem] font-black text-slate-900">Thank You!</h2>
            <p className="text-[0.875rem] text-slate-500 mt-2 font-medium">
              Your feedback helps other EV owners find the best charging spots in the city.
            </p>
            <button onClick={onClose}
              className="mt-8 w-full py-4 bg-primary text-white rounded-2xl text-[0.9375rem] font-bold shadow-lg shadow-primary/20">
              Close
            </button>
          </div>
        ) : (
          // CONDITION 2: SHOW THE INPUT FORM
          <div className="p-5">
            <div className="text-center mb-6">
              <p className="text-[0.8rem] text-slate-400 font-bold uppercase tracking-widest mb-1">Your experience at</p>
              <p className="text-[1rem] font-black text-slate-900 leading-tight">{booking.chargerTitle}</p>
            </div>

            {/* The Star Selection Component */}
            <div className="flex justify-center mb-6">
              <StarRating 
                rating={rating} 
                size={32} 
                showValue={false} 
                interactive // This allows users to click to change the rating
                onRate={setRating} 
              />
            </div>

            {/* Comment Box */}
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think? Ease of access, speed of charging, host behavior..."
              className="w-full h-32 p-4 border border-slate-100 rounded-2xl text-[0.9rem] font-medium resize-none bg-slate-50 outline-none focus:border-primary focus:bg-white transition-all shadow-inner" />

            {error && <p className="text-red-500 text-[0.8rem] font-bold mt-3 text-center">{error}</p>}

            {/* The Final Submit Button */}
            <button 
              onClick={handleSubmit} 
              // Disable button if text is empty or we are currently saving
              disabled={!comment.trim() || loading}
              className={`w-full mt-6 h-14 rounded-2xl text-[0.9375rem] font-black flex items-center justify-center gap-2 transition-all shadow-xl ${comment.trim() && !loading ? "bg-primary text-white shadow-primary/20" : "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"}`}>
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Posting Review…</> : "Share My Story"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
