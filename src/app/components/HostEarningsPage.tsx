import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  Zap,
  ChevronRight,
  Loader2,
  Wallet,
  AlertCircle,
  ArrowDownCircle,
  CalendarDays,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { fetchHostBookings, updateBookingsCashedOutStatus } from "../../lib/db";
import type { Booking } from "../data/mock-data";
import { toast } from "sonner";

/**
 * HOST EARNINGS PAGE
 * Shows total earnings from bookings on a host's listed chargers.
 * Hosts can see completed/pending earnings and request a cashout.
 * **Platform Fee Logic**: A hard-coded 5% platform commission is automatically deducted from host earnings calculations at the query layer. No service fees are charged to the user.
 */
export function HostEarningsPage() {
  const navigate = useNavigate();
  const { user, chargers, topUpWallet } = useApp();
  const [hostBookings, setHostBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashingOut, setCashingOut] = useState(false);

  // A 5% platform fee (simulated)
  const PLATFORM_FEE_PERCENT = 5;

  const userChargers = chargers.filter((c) => c.ownerId === user?.id);
  const isHost = userChargers.length > 0;

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchHostBookings(user.id).then((b) => {
      setHostBookings(b);
      setLoading(false);
    });
  }, [user]);

  // --- EARNINGS MATH ---
  const completedBookings = hostBookings.filter((b) => b.status === "completed" && !b.cashedOut);
  const upcomingBookings = hostBookings.filter((b) => b.status === "upcoming");
  const cancelledBookings = hostBookings.filter((b) => b.status === "cancelled");

  const grossEarnings = completedBookings.reduce((sum, b) => sum + b.totalCost, 0);
  const platformFee = Math.round(grossEarnings * PLATFORM_FEE_PERCENT / 100);
  const netEarnings = grossEarnings - platformFee;

  const pendingRevenue = upcomingBookings.reduce((sum, b) => sum + b.totalCost, 0);
  const totalSessions = completedBookings.length;
  const totalHours = completedBookings.reduce((sum, b) => sum + b.duration, 0);

  // --- CASHOUT HANDLER ---
  const handleCashout = async () => {
    if (netEarnings <= 0) {
      toast.error("No earnings available to cash out.");
      return;
    }
    setCashingOut(true);
    
    const bookingIdsToCashout = completedBookings.map((b) => b.id);
    const dbSuccess = await updateBookingsCashedOutStatus(bookingIdsToCashout, true);
    
    if (!dbSuccess) {
      toast.error("Failed to process cashout. Please try again.");
      setCashingOut(false);
      return;
    }

    // Credit to wallet
    const success = await topUpWallet(netEarnings, `host-cashout-${Date.now()}`);
    if (success) {
      toast.success(`₹${netEarnings} has been added to your PlugPoint Wallet!`);
      setHostBookings((prev) =>
        prev.map((b) =>
          bookingIdsToCashout.includes(b.id) ? { ...b, cashedOut: true } : b
        )
      );
    } else {
      // Rollback database update if wallet credit failed
      await updateBookingsCashedOutStatus(bookingIdsToCashout, false);
      toast.error("Cashout failed. Please try again.");
    }
    setCashingOut(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">Please sign in to view earnings.</p>
      </div>
    );
  }

  return (
    <div className="pb-6 bg-background min-h-full">
      {/* ─── HEADER ─── */}
      <div className="header-gradient relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 px-5 pt-5 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => navigate("/profile")}
              className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <h1 className="text-white text-[1.1rem]" style={{ fontWeight: 700 }}>
              Host Earnings
            </h1>
          </div>

          {/* Big Net Earnings Display */}
          <div className="text-center py-3">
            <p className="text-white/40 text-[0.7rem] font-bold uppercase tracking-widest mb-1">
              Net Earnings
            </p>
            {loading ? (
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            ) : (
              <p className="text-emerald-400 text-[2.5rem]" style={{ fontWeight: 800, lineHeight: 1.1 }}>
                ₹{netEarnings.toLocaleString("en-IN")}
              </p>
            )}
            <p className="text-white/30 text-[0.7rem] mt-1 font-medium">
              After {PLATFORM_FEE_PERCENT}% platform fee
            </p>
          </div>

          {/* Stats Row */}
          {!loading && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: "Sessions", value: totalSessions.toString(), icon: CheckCircle2 },
                { label: "Hours", value: totalHours.toFixed(1), icon: Clock },
                { label: "Pending", value: `₹${pendingRevenue}`, icon: CalendarDays },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center p-3 bg-white/5 rounded-xl border border-white/5"
                >
                  <stat.icon className="w-3.5 h-3.5 text-emerald-400/60 mb-1" />
                  <span className="text-[1rem] text-white font-bold">{stat.value}</span>
                  <span className="text-[0.55rem] text-white/30 mt-0.5 font-bold uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── CASHOUT CARD ─── */}
      <div className="mx-4 -mt-3 relative z-10">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Wallet className="w-4.5 h-4.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[0.85rem] font-bold text-slate-900">Cashout to Wallet</p>
                <p className="text-[0.65rem] text-slate-400 font-medium">
                  Transfer earnings to your PlugPoint wallet
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-slate-50 rounded-xl p-3 mb-3 space-y-2">
            <div className="flex items-center justify-between text-[0.8rem]">
              <span className="text-slate-500">Gross Earnings</span>
              <span className="font-semibold text-slate-700">₹{grossEarnings.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between text-[0.8rem]">
              <span className="text-slate-500">Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
              <span className="font-semibold text-red-500">-₹{platformFee.toLocaleString("en-IN")}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[0.85rem]">
              <span className="font-bold text-slate-800">Available to Cashout</span>
              <span className="font-bold text-emerald-600">₹{netEarnings.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <button
            onClick={handleCashout}
            disabled={cashingOut || netEarnings <= 0 || loading}
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex justify-center items-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {cashingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <ArrowDownCircle className="w-4 h-4" /> Cashout ₹{netEarnings.toLocaleString("en-IN")}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── NOT A HOST? ─── */}
      {!isHost && !loading && (
        <div className="mx-4 mt-4">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[0.85rem] font-bold text-amber-900">No chargers listed</p>
              <p className="text-[0.7rem] text-amber-700/70 mt-0.5">
                List your first charger to start earning from EV drivers in your area.
              </p>
              <button
                onClick={() => navigate("/list-charger")}
                className="mt-2 px-4 py-1.5 bg-amber-500 text-white rounded-lg text-[0.75rem] font-bold hover:bg-amber-600 transition-colors"
              >
                List a Charger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EARNINGS BREAKDOWN PER CHARGER ─── */}
      {isHost && !loading && (
        <div className="mt-5">
          <h3 className="px-5 text-[0.65rem] text-slate-400 uppercase tracking-widest mb-2 font-bold">
            Earnings by Charger
          </h3>
          <div className="mx-4 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            {userChargers.map((ch, i) => {
              const chBookings = completedBookings.filter((b) => b.chargerId === ch.id);
              const chGross = chBookings.reduce((sum, b) => sum + b.totalCost, 0);
              const chNet = chGross - Math.round(chGross * PLATFORM_FEE_PERCENT / 100);
              return (
                <div
                  key={ch.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    i < userChargers.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.85rem] font-semibold text-slate-700 truncate">
                      {ch.title}
                    </p>
                    <p className="text-[0.65rem] text-slate-400 font-medium">
                      {chBookings.length} sessions · {ch.power} kW
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.85rem] font-bold text-emerald-600">₹{chNet}</p>
                    <p className="text-[0.6rem] text-slate-400 font-medium">net</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── RECENT TRANSACTIONS ─── */}
      {!loading && hostBookings.length > 0 && (
        <div className="mt-5">
          <h3 className="px-5 text-[0.65rem] text-slate-400 uppercase tracking-widest mb-2 font-bold">
            Recent Transactions
          </h3>
          <div className="mx-4 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            {hostBookings.slice(0, 10).map((b, i) => {
              const statusColor =
                b.status === "completed"
                  ? "text-emerald-600 bg-emerald-50"
                  : b.status === "upcoming"
                  ? "text-blue-600 bg-blue-50"
                  : b.status === "cancelled"
                  ? "text-red-500 bg-red-50"
                  : "text-amber-600 bg-amber-50";
              return (
                <div
                  key={b.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i < Math.min(hostBookings.length, 10) - 1
                      ? "border-b border-slate-50"
                      : ""
                  }`}
                >
                  <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8rem] font-semibold text-slate-700 truncate">
                      {b.chargerTitle}
                    </p>
                    <p className="text-[0.6rem] text-slate-400 font-medium">
                      {b.date} · {b.startTime} – {b.endTime}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[0.8rem] font-bold text-slate-800">
                      ₹{b.totalCost}
                    </span>
                    <span
                      className={`text-[0.55rem] font-bold uppercase px-1.5 py-0.5 rounded-md ${statusColor}`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && hostBookings.length === 0 && isHost && (
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
            <DollarSign className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-[0.95rem] font-bold text-slate-800">No earnings yet</p>
          <p className="text-[0.8rem] text-slate-400 mt-1 max-w-[260px]">
            Once EV drivers book your charger, your earnings will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
