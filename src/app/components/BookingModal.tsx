import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { addDays, format } from "date-fns";
import {
  X, Calendar, Clock, CreditCard, CheckCircle,
  Zap, Shield, ChevronLeft, Loader2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import type { Charger } from "../data/mock-data";

interface BookingModalProps {
  charger: Charger;
  onClose: () => void;
}

const timeSlots = [
  "6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
  "6:00 PM","7:00 PM","8:00 PM","9:00 PM","10:00 PM",
];

type Step = "datetime" | "payment" | "confirmation";

export function BookingModal({ charger, onClose }: BookingModalProps) {
  const navigate = useNavigate();
  const { addBooking, user, isAuthenticated } = useApp();

  // Generate next 7 real dates dynamically
  const dates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = addDays(new Date(), i);
      return {
        day: format(d, "EEE"),
        date: format(d, "MMM d"),
        full: format(d, "MMM d, yyyy"),
      };
    }), []);

  const [step, setStep] = useState<Step>("datetime");
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  
  // Helper to check if a time slot has passed
  const isTimeInPast = (timeStr: string, dateStr: string) => {
    const today = format(new Date(), "MMM d");
    if (dateStr !== today) return false;

    const now = new Date();
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    
    const slotTime = new Date();
    slotTime.setHours(hours, minutes || 0, 0, 0);
    
    // Give a 15 min buffer to account for the booking process
    return slotTime.getTime() < now.getTime() - (15 * 60 * 1000);
  };

  // Find first available time slot for today
  const defaultStartTime = useMemo(() => {
    const firstFuture = timeSlots.find(t => !isTimeInPast(t, dates[0].date));
    return firstFuture || "9:00 AM"; // Fallback to 9 AM if day is over
  }, [dates]);

  const [startTime, setStartTime] = useState(defaultStartTime);
  const [duration, setDuration] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update startTime when date changes if current startTime is invalid for new date
  useEffect(() => {
    if (isTimeInPast(startTime, selectedDate.date)) {
      const nextValid = timeSlots.find(t => !isTimeInPast(t, selectedDate.date));
      if (nextValid) setStartTime(nextValid);
    }
  }, [selectedDate, startTime]);

  const subtotal = charger.pricePerHour * duration;
  const serviceFee = 10;
  const total = subtotal + serviceFee;

  const getEndTime = () => {
    const startIdx = timeSlots.indexOf(startTime);
    const endIdx = startIdx + duration;
    return endIdx < timeSlots.length ? timeSlots[endIdx] : "11:00 PM";
  };

  const handleConfirm = async () => {
    if (!isAuthenticated || !user) {
      setError("Please sign in to make a booking.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const saved = await addBooking({
        chargerId: charger.id,
        chargerTitle: charger.title,
        chargerImage: charger.image,
        chargerAddress: `${charger.address}, ${charger.city}`,
        hostName: charger.ownerName,
        date: selectedDate.full,
        startTime,
        endTime: getEndTime(),
        duration,
        totalCost: total,
        status: "upcoming",
        connectorType: charger.connectorType,
        power: charger.power,
      });
      if (!saved) throw new Error("Failed to save booking. Please try again.");
      setStep("confirmation");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center justify-between z-10">
          {step === "payment" ? (
            <button onClick={() => setStep("datetime")}>
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-5" />
          )}
          <h3 className="text-[0.9375rem]" style={{ fontWeight: 600 }}>
            {step === "datetime" ? "Select Date & Time" : step === "payment" ? "Payment" : "Booking Confirmed!"}
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Step 1: Date & Time */}
        {step === "datetime" && (
          <div className="p-4">
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-[0.8125rem]" style={{ fontWeight: 600 }}>{charger.title}</p>
                <p className="text-[0.6875rem] text-muted-foreground">{charger.connectorType} · {charger.power} kW</p>
              </div>
              <span className="text-[0.875rem] text-primary" style={{ fontWeight: 700 }}>₹{charger.pricePerHour}/hr</span>
            </div>

            <label className="text-[0.8125rem] text-muted-foreground mb-2 block" style={{ fontWeight: 500 }}>
              <Calendar className="w-3.5 h-3.5 inline mr-1" />Select Date
            </label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
              {dates.map((d) => (
                <button key={d.date} onClick={() => setSelectedDate(d)}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[3.5rem] transition-colors ${selectedDate.date === d.date ? "bg-primary text-white" : "bg-muted text-foreground"}`}>
                  <span className="text-[0.6875rem]" style={{ fontWeight: 500 }}>{d.day}</span>
                  <span className="text-[0.8125rem]" style={{ fontWeight: 600 }}>{d.date.split(" ")[1]}</span>
                </button>
              ))}
            </div>

            <label className="text-[0.8125rem] text-muted-foreground mb-2 block" style={{ fontWeight: 500 }}>
              <Clock className="w-3.5 h-3.5 inline mr-1" />Start Time
            </label>
            <div className="grid grid-cols-4 gap-1.5 mb-4 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
              {timeSlots.map((t) => {
                const isPast = isTimeInPast(t, selectedDate.date);
                return (
                  <button 
                    key={t} 
                    onClick={() => !isPast && setStartTime(t)}
                    disabled={isPast}
                    className={`px-2 py-1.5 rounded-lg text-[0.75rem] transition-colors ${
                      startTime === t 
                        ? "bg-primary text-white" 
                        : isPast 
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50" 
                          : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            <label className="text-[0.8125rem] text-muted-foreground mb-2 block" style={{ fontWeight: 500 }}>Duration (hours)</label>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setDuration(Math.max(1, duration - 1))}
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-[1.125rem]">-</button>
              <span className="text-[1.25rem] w-8 text-center" style={{ fontWeight: 700 }}>{duration}</span>
              <button onClick={() => setDuration(Math.min(8, duration + 1))}
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-[1.125rem]">+</button>
              <span className="text-[0.75rem] text-muted-foreground ml-2">{startTime} – {getEndTime()}</span>
            </div>

            <div className="p-3 bg-muted rounded-xl mb-4">
              <div className="flex justify-between text-[0.8125rem] mb-1">
                <span className="text-muted-foreground">₹{charger.pricePerHour} × {duration} hr{duration > 1 ? "s" : ""}</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-[0.8125rem] mb-1">
                <span className="text-muted-foreground">Service fee</span>
                <span>₹{serviceFee}</span>
              </div>
              <div className="flex justify-between text-[0.9375rem] pt-2 border-t border-border mt-2" style={{ fontWeight: 700 }}>
                <span>Total</span>
                <span className="text-primary">₹{total}</span>
              </div>
            </div>

            <button onClick={() => setStep("payment")}
              className="w-full py-3 bg-primary text-white rounded-xl text-[0.9375rem]">
              Continue to Payment
            </button>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === "payment" && (
          <div className="p-4">
            <div className="p-3 bg-secondary rounded-xl mb-4">
              <p className="text-[0.8125rem]" style={{ fontWeight: 600 }}>{charger.title}</p>
              <p className="text-[0.75rem] text-muted-foreground mt-0.5">{selectedDate.full} | {startTime} – {getEndTime()}</p>
              <p className="text-[0.9375rem] text-primary mt-1" style={{ fontWeight: 700 }}>₹{total}</p>
            </div>

            <label className="text-[0.8125rem] text-muted-foreground mb-2 block" style={{ fontWeight: 500 }}>Payment Method</label>
            <div className="space-y-2 mb-4">
              {[
                { id: "upi", label: "UPI", detail: "PhonePe / GPay / Paytm" },
                { id: "card", label: "Credit / Debit Card", detail: "" },
                { id: "wallet", label: "PlugPoint Wallet", detail: "₹0 balance" },
              ].map((m) => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-colors ${paymentMethod === m.id ? "border-primary bg-secondary" : "border-border"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === m.id ? "border-primary" : "border-gray-300"}`}>
                    {paymentMethod === m.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[0.8125rem] flex-1 text-left" style={{ fontWeight: 500 }}>{m.label}</span>
                  {m.detail && <span className="text-[0.75rem] text-muted-foreground">{m.detail}</span>}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-lg mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-[0.75rem] text-muted-foreground">Payment is held securely until your session completes</span>
            </div>

            {error && <p className="text-red-500 text-[0.8125rem] mb-3 text-center">{error}</p>}

            <button onClick={handleConfirm} disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl text-[0.9375rem] flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Confirming…</> : `Confirm & Pay ₹${total}`}
            </button>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === "confirmation" && (
          <div className="p-4 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-[1.25rem]" style={{ fontWeight: 700 }}>Booking Confirmed!</h2>
            <p className="text-[0.875rem] text-muted-foreground mt-1">Your booking has been saved ✓</p>

            <div className="mt-4 p-4 bg-secondary rounded-xl text-left">
              <p className="text-[0.9375rem]" style={{ fontWeight: 600 }}>{charger.title}</p>
              <p className="text-[0.8125rem] text-muted-foreground mt-1">{charger.address}, {charger.city}</p>
              <div className="flex items-center gap-4 mt-3">
                <div><p className="text-[0.6875rem] text-muted-foreground">Date</p><p className="text-[0.8125rem]" style={{ fontWeight: 600 }}>{selectedDate.full}</p></div>
                <div><p className="text-[0.6875rem] text-muted-foreground">Time</p><p className="text-[0.8125rem]" style={{ fontWeight: 600 }}>{startTime} – {getEndTime()}</p></div>
                <div><p className="text-[0.6875rem] text-muted-foreground">Total</p><p className="text-[0.8125rem] text-primary" style={{ fontWeight: 700 }}>₹{total}</p></div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => { onClose(); navigate("/bookings"); }}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-[0.875rem]">View Bookings</button>
              <button onClick={onClose}
                className="flex-1 py-2.5 border border-border rounded-xl text-[0.875rem]">Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}