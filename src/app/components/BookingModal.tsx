import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { addDays, format, parse, addMinutes } from "date-fns";
import {
  X, Calendar, Clock, CreditCard, CheckCircle,
  Zap, Shield, ChevronLeft, Loader2, IndianRupee,
  BatteryCharging, Play
} from "lucide-react";
import { useApp } from "../context/AppContext";
import type { Charger } from "../../types";
import { fetchChargerBookingsByDate } from "../../lib/db";

declare var Razorpay: any;

interface BookingModalProps {
  charger: Charger;
  onClose: () => void;
}

const hourlySlots = [
  "6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
  "6:00 PM","7:00 PM","8:00 PM","9:00 PM","10:00 PM"
];

const halfHourlySlots = [
  "6:00 AM","6:30 AM","7:00 AM","7:30 AM","8:00 AM","8:30 AM",
  "9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM",
  "6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM",
  "9:00 PM","9:30 PM","10:00 PM","10:30 PM"
];

type Step = "datetime" | "payment" | "confirmation";
type BookingMode = "amount" | "time" | "future";

function parseTimeToDate(timeStr: string, fullDateStr: string) {
  return parse(`${fullDateStr} ${timeStr}`, 'MMM d, yyyy h:mm a', new Date());
}

export function BookingModal({ charger, onClose }: BookingModalProps) {
  const navigate = useNavigate();
  const { addBooking, user, isAuthenticated, payWithWallet } = useApp();

  const dates = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = addDays(new Date(), i);
      return { day: format(d, "EEE"), date: format(d, "MMM d"), full: format(d, "MMM d, yyyy") };
    }), []);

  const [step, setStep] = useState<Step>("datetime");
  const [bookingMode, setBookingMode] = useState<BookingMode>("amount");
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  
  // By Amount
  const [enteredAmount, setEnteredAmount] = useState<number>(100);
  
  // By Time / Future
  const [durationHours, setDurationHours] = useState<number>(1);
  const [durationMins, setDurationMins] = useState<number>(0);

  // Time grid
  const [startTime, setStartTime] = useState("9:00 AM");
  
  const [existingBookings, setExistingBookings] = useState<any[]>([]);

  // Adjust selectedDate if mode changes (hide future dates for amount/time)
  useEffect(() => {
    if (bookingMode !== "future") {
      setSelectedDate(dates[0]);
    }
  }, [bookingMode, dates]);

  useEffect(() => {
    async function loadBookings() {
      const data = await fetchChargerBookingsByDate(charger.id, selectedDate.full);
      setExistingBookings(data);
    }
    loadBookings();
  }, [charger.id, selectedDate.full]);

  const blockedRanges = useMemo(() => {
    return existingBookings.map(b => {
      const startMs = parseTimeToDate(b.startTime, b.date).getTime();
      const endMs = startMs + (b.duration * 60 * 60 * 1000);
      return { startMs, endMs };
    });
  }, [existingBookings]);

  const isTimeDisabled = (timeStr: string) => {
    const slotStartMs = parseTimeToDate(timeStr, selectedDate.full).getTime();
    const slotEndMs = slotStartMs + 60000; // 1 min buffer
    
    if (slotStartMs < Date.now() - (15 * 60 * 1000)) return true;
    return blockedRanges.some(r => slotStartMs < r.endMs && slotEndMs > r.startMs);
  };

  const activeTimeGrid = bookingMode === "future" ? halfHourlySlots : hourlySlots;

  // Set default valid start time
  useEffect(() => {
    if (isTimeDisabled(startTime) || !activeTimeGrid.includes(startTime)) {
      const nextValid = activeTimeGrid.find(t => !isTimeDisabled(t));
      if (nextValid) setStartTime(nextValid);
    }
  }, [selectedDate, startTime, activeTimeGrid, blockedRanges]);

  const getMaxAllowedDurationMinutes = () => {
    try {
      const startMs = parseTimeToDate(startTime, selectedDate.full).getTime();
      let minDiffMs = Infinity;
      for (const r of blockedRanges) {
        // If the blocked range starts exactly or after our chosen start time
        // Note: we consider equality as well to prevent overlapping with an exact start match
        if (r.startMs > startMs) {
             const diff = r.startMs - startMs;
             if (diff < minDiffMs) minDiffMs = diff;
        }
      }
      return Math.min(minDiffMs > 0 && minDiffMs !== Infinity ? minDiffMs / 60000 : 8 * 60, 8 * 60);
    } catch (e) { return 8 * 60; }
  };

  useEffect(() => {
    const maxMins = getMaxAllowedDurationMinutes();
    if (bookingMode === "amount") {
       const reqMins = (enteredAmount / charger.pricePerHour) * 60;
       if (reqMins > maxMins) {
           setEnteredAmount(Math.floor((maxMins / 60) * charger.pricePerHour));
       }
    } else {
       const reqMins = (durationHours * 60) + durationMins;
       if (reqMins > maxMins && maxMins >= 15) { // minimum 15 mins block
           setDurationHours(Math.floor(maxMins / 60));
           setDurationMins(maxMins % 60);
       }
    }
  }, [startTime, enteredAmount, durationHours, durationMins, bookingMode, blockedRanges]);

  // Derived Values
  const finalDurationHoursFloat = bookingMode === "amount" 
    ? enteredAmount / charger.pricePerHour 
    : durationHours + (durationMins / 60);
    
  const finalDurationMinsTotal = finalDurationHoursFloat * 60;
  
  const finalEndTime = useMemo(() => {
     try {
       const startDate = parseTimeToDate(startTime, selectedDate.full);
       if (isNaN(startDate.getTime())) return "Unknown";
       const endDate = addMinutes(startDate, finalDurationMinsTotal);
       return format(endDate, "h:mm a");
     } catch (e) { return "Unknown"; }
  }, [startTime, selectedDate.full, finalDurationMinsTotal]);

  const finalUnitsKwh = Number((finalDurationHoursFloat * charger.power).toFixed(1));
  const subtotal = bookingMode === "amount" ? enteredAmount : (finalDurationHoursFloat * charger.pricePerHour);
  const serviceFee = 0;
  const total = Number((subtotal + serviceFee).toFixed(2));

  // Payment 
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalizeBooking = async () => {
    try {
      const saved = await addBooking({
        chargerId: charger.id,
        chargerTitle: charger.title,
        chargerImage: charger.image,
        chargerAddress: `${charger.address}, ${charger.city}`,
        hostName: charger.ownerName,
        date: selectedDate.full,
        startTime,
        endTime: finalEndTime,
        duration: Number(finalDurationHoursFloat.toFixed(2)),
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

  const handleConfirm = async () => {
    if (!isAuthenticated || !user) {
      setError("Please sign in to make a booking.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (paymentMethod === "wallet") {
        if (user.walletBalance < total) {
          throw new Error("Insufficient wallet balance. Please use UPI/Card or add funds.");
        }
        const success = await payWithWallet(total, `Booking for ${charger.title}`);
        if (!success) throw new Error("Wallet deduction failed.");
        await finalizeBooking();
      } else {
        const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
        if (!razorpayKeyId) throw new Error("Razorpay is not configured.");

        const options = {
          key: razorpayKeyId,
          amount: Math.round(total * 100),
          currency: "INR",
          name: "PlugPoint",
          description: `Booking: ${charger.title}`,
          handler: async function (response: any) {
            try { await finalizeBooking(); } 
            catch (err) { setError("Booking save failed after payment."); setLoading(false); }
          },
          prefill: { name: user.name, email: user.email, contact: user.phone.replace(/\s/g, '') },
          theme: { color: "#10b981" },
          modal: { ondismiss: function() { setLoading(false); } }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response: any){
          setError(`Payment failed: ${response.error.description}`);
          setLoading(false);
        });
        rzp.open();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred.");
      setLoading(false);
    }
  };

  // Convert minutes to readable string
  const getReadableDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h} hr${h>1?'s':''}`;
    return `${m} mins`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        
        {/* Header Block */}
        <div className="sticky top-0 bg-white border-b border-border px-4 py-3 flex items-center justify-between z-10 shadow-sm">
          {step === "payment" ? (
            <button onClick={() => setStep("datetime")}><ChevronLeft className="w-5 h-5 cursor-pointer" /></button>
          ) : <div className="w-5" />}
          
          <h3 className="text-[0.9375rem]" style={{ fontWeight: 600 }}>
            {step === "datetime" ? "Schedule Charge" : step === "payment" ? "Payment" : "Booking Confirmed!"}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

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

            {/* TAB SELECTOR */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
              <button onClick={()=>setBookingMode("amount")} className={`flex-1 text-[0.75rem] font-semibold py-2 rounded-lg transition-all ${bookingMode === "amount" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>By Amount</button>
              <button onClick={()=>setBookingMode("time")} className={`flex-1 text-[0.75rem] font-semibold py-2 rounded-lg transition-all ${bookingMode === "time" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>By Time</button>
              <button onClick={()=>setBookingMode("future")} className={`flex-1 text-[0.75rem] font-semibold py-2 rounded-lg transition-all ${bookingMode === "future" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Future</button>
            </div>

            {/* DATE SELECTOR (Future Booking Only) */}
            {bookingMode === "future" && (
              <>
                <label className="text-[0.8125rem] text-muted-foreground mb-2 block font-medium">Select Date</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                  {dates.map((d) => (
                    <button key={d.date} onClick={() => setSelectedDate(d)}
                      className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[3.5rem] transition-colors ${selectedDate.date === d.date ? "bg-primary text-white shadow-sm" : "bg-muted text-foreground"}`}>
                      <span className="text-[0.6875rem] font-medium">{d.day}</span>
                      <span className="text-[0.8125rem] font-bold">{d.date.split(" ")[1]}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* START TIME */}
            <label className="text-[0.8125rem] text-muted-foreground mb-2 flex items-center justify-between font-medium">
              <span><Clock className="w-3.5 h-3.5 inline mr-1" />Start Time</span>
              <span className="text-[0.6875rem] text-primary font-bold">Max allowed: {getReadableDuration(getMaxAllowedDurationMinutes())}</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 mb-4 max-h-[140px] overflow-y-auto pr-1 no-scrollbar">
              {activeTimeGrid.map((t) => {
                const isDisabled = isTimeDisabled(t);
                return (
                  <button key={t} onClick={() => !isDisabled && setStartTime(t)} disabled={isDisabled}
                    className={`px-1.5 py-1.5 rounded-lg text-[0.7rem] font-medium transition-colors border ${
                      startTime === t ? "bg-primary text-white border-primary" : isDisabled ? "bg-slate-50 text-slate-300 border-transparent cursor-not-allowed" : "bg-white text-slate-600 border-slate-200 hover:border-primary/50"
                    }`}>
                    {t}
                  </button>
                );
              })}
            </div>

            {/* AMOUNT / DURATION CONTROLS */}
            {bookingMode === "amount" ? (
               <div className="mb-4">
                 <label className="text-[0.8125rem] text-muted-foreground mb-2 block font-medium">Charge Amount</label>
                 <div className="relative">
                   <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                     <IndianRupee className="w-5 h-5" />
                   </div>
                   <input type="number" min="10" step="10" value={enteredAmount || ''} 
                    onChange={(e) => setEnteredAmount(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[1rem] font-bold focus:ring-2 focus:ring-primary/20 outline-none" placeholder="0" />
                 </div>
                 <div className="flex gap-4 mt-3 px-1">
                   <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg flex-1 text-center border border-blue-100">
                     <span className="block text-[0.6rem] font-semibold uppercase opacity-70">Calculated Time</span>
                     <span className="text-[0.875rem] font-bold">{getReadableDuration(finalDurationMinsTotal)}</span>
                   </div>
                   <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg flex-1 text-center border border-emerald-100">
                     <span className="block text-[0.6rem] font-semibold uppercase opacity-70">Est. Power</span>
                     <span className="text-[0.875rem] font-bold">{finalUnitsKwh} kWh</span>
                   </div>
                 </div>
               </div>
            ) : (
               <div className="mb-4">
                 <label className="text-[0.8125rem] text-muted-foreground mb-2 block font-medium">Duration</label>
                 <div className="flex gap-3">
                   <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                     <span className="text-[0.6rem] text-slate-400 font-bold uppercase block mb-1">Hours</span>
                     <select value={durationHours} onChange={e => setDurationHours(Number(e.target.value))} className="w-full bg-transparent text-[0.9375rem] font-bold outline-none cursor-pointer">
                       {[0,1,2,3,4,5,6,7,8].map(h => <option key={`h-${h}`} value={h}>{h} hr{h !== 1 ? 's' : ''}</option>)}
                     </select>
                   </div>
                   <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                     <span className="text-[0.6rem] text-slate-400 font-bold uppercase block mb-1">Minutes</span>
                     <select value={durationMins} onChange={e => setDurationMins(Number(e.target.value))} className="w-full bg-transparent text-[0.9375rem] font-bold outline-none cursor-pointer">
                       <option value={0}>0 min</option>
                       <option value={15}>15 mins</option>
                       <option value={30}>30 mins</option>
                       <option value={45}>45 mins</option>
                     </select>
                   </div>
                 </div>
               </div>
            )}

            <div className="p-3 bg-muted rounded-xl mb-4">
              <div className="flex justify-between text-[0.8125rem] mb-1">
                <span className="text-muted-foreground">End Time</span>
                <span className="font-semibold">{finalEndTime}</span>
              </div>
              <div className="flex justify-between text-[0.8125rem] mb-1 text-muted-foreground">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[0.8125rem] mb-1 text-muted-foreground">
                <span className="text-muted-foreground">Service fee</span>
                <span>₹{serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[0.9375rem] pt-2 border-t border-border mt-2" style={{ fontWeight: 700 }}>
                <span>Total</span>
                <span className="text-primary">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={() => setStep("payment")} disabled={finalDurationMinsTotal === 0}
              className="w-full py-3 bg-primary text-white rounded-xl text-[0.9375rem] font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              Continue to Payment
            </button>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === "payment" && (
          <div className="p-4">
            <div className="p-3 bg-secondary rounded-xl mb-4">
              <p className="text-[0.8125rem]" style={{ fontWeight: 600 }}>{charger.title}</p>
              <p className="text-[0.75rem] text-muted-foreground mt-0.5">{selectedDate.full} | {startTime} – {finalEndTime}</p>
              <p className="text-[0.9375rem] text-primary mt-1" style={{ fontWeight: 700 }}>₹{total.toFixed(2)}</p>
            </div>

            <label className="text-[0.8125rem] text-muted-foreground mb-2 block" style={{ fontWeight: 500 }}>Payment Method</label>
            <div className="space-y-2 mb-4">
              {[
                { id: "upi", label: "UPI", detail: "PhonePe / GPay / Paytm" },
                { id: "card", label: "Credit / Debit Card", detail: "" },
                { id: "wallet", label: "PlugPoint Wallet", detail: `₹${user?.walletBalance || 0} balance` },
              ].map((m) => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                  className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-colors ${paymentMethod === m.id ? "border-primary bg-secondary shadow-sm" : "border-border"}`}>
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
              <span className="text-[0.75rem] text-emerald-700 font-medium">Payment is held securely until your session completes</span>
            </div>

            {error && <p className="text-red-500 text-[0.8125rem] mb-3 text-center">{error}</p>}

            <button onClick={handleConfirm} disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl text-[0.9375rem] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 shadow-md">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Confirming…</> : `Confirm & Pay ₹${total.toFixed(2)}`}
            </button>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === "confirmation" && (() => {
          // Determine if the booking is "now" (today + start time is within current hour)
          const todayStr = format(new Date(), "MMM d, yyyy");
          const isToday = selectedDate.full === todayStr;
          const now = new Date();
          let canStartNow = false;
          if (isToday) {
            try {
              const slotTime = parse(startTime, "h:mm a", new Date());
              // Allow starting if session starts within the next 15 mins or has already started
              const diffMs = slotTime.getTime() - now.getTime();
              canStartNow = diffMs <= 15 * 60 * 1000;
            } catch (e) { canStartNow = false; }
          }
          return (
          <div className="p-4 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 scale-in">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-[1.25rem] font-bold">Booking Confirmed!</h2>
            <p className="text-[0.875rem] text-slate-500 mt-1 font-medium">Your charging station is reserved ✓</p>

            <div className="mt-4 p-4 bg-secondary rounded-xl text-left shadow-sm border border-slate-100">
              <p className="text-[0.9375rem] font-bold">{charger.title}</p>
              <p className="text-[0.8125rem] text-slate-500 mt-1 font-medium">{charger.address}, {charger.city}</p>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-200">
                <div><p className="text-[0.6rem] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Date</p><p className="text-[0.8125rem] font-bold text-slate-800">{selectedDate.full}</p></div>
                <div><p className="text-[0.6rem] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Time</p><p className="text-[0.8125rem] font-bold text-slate-800">{startTime} – {finalEndTime}</p></div>
                <div><p className="text-[0.6rem] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Total</p><p className="text-[0.8125rem] font-bold text-primary">₹{total.toFixed(2)}</p></div>
              </div>
            </div>

            {/* START CHARGING SESSION BUTTON */}
            {canStartNow ? (
              <button
                onClick={() => { onClose(); navigate("/bookings"); }}
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl text-[0.9375rem] flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all active:scale-[0.98]"
              >
                <BatteryCharging className="w-5 h-5" />
                Start Charging Session Now
              </button>
            ) : (
              <div className="w-full mt-4 py-3.5 bg-slate-100 text-slate-400 font-bold rounded-xl text-[0.85rem] flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Session starts {isToday ? `at ${startTime}` : `on ${selectedDate.full}`}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button onClick={() => { onClose(); navigate("/bookings"); }}
                className="flex-1 py-3 border border-primary text-primary font-bold rounded-xl text-[0.875rem] transition-colors hover:bg-primary/5">View Bookings</button>
              <button onClick={onClose}
                className="flex-1 py-3 border border-slate-200 font-bold hover:bg-slate-50 rounded-xl text-[0.875rem] transition-colors">Done</button>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
}
