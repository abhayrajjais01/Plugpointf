import { useState } from "react";
import { useNavigate } from "react-router";
import {
  User,
  Shield,
  Star,
  CalendarDays,
  Zap,
  ChevronRight,
  LogOut,
  HelpCircle,
  CreditCard,
  MessageCircle,
  Award,
  Car,
  Battery,
  X,
  Loader2,
  Pencil,
  Wallet,
  Bookmark,
  PlugZap,
  Tag,
  Lock,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";
import { EvSetupModal } from "./EvSetupModal";
import { ProfileEditModal } from "./ProfileEditModal";
import { ensureRazorpayLoaded } from "../../lib/utils";

/**
 * --- THE PROFILE PAGE ---
 * Redesigned to match the Statiq-style mobile profile UI:
 * - Light green gradient header with avatar, name, email, phone
 * - "Your GREEN journey starts today" banner
 * - Promo/wallet card (dark)
 * - 3 quick-action shortcuts
 * - Wallet balance row with Add Credits
 * - Manage section
 * - Stations section
 */
export function ProfilePage() {
  const navigate = useNavigate();
  const [avatarError, setAvatarError] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(500);
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [isEvSetupOpen, setIsEvSetupOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const { user, isAuthenticated, logout, bookings, chargers, reviews, topUpWallet, activeVehicle } = useApp();

  const handleTopUp = async () => {
    if (!user) return;
    setIsToppingUp(true);
    try {
      // Ensure Razorpay SDK is loaded before proceeding
      await ensureRazorpayLoaded();

      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKeyId) {
        throw new Error("Razorpay is not configured. Please add VITE_RAZORPAY_KEY_ID to your .env file.");
      }
      const options = {
        key: razorpayKeyId,
        amount: topUpAmount * 100,
        currency: "INR",
        name: "PlugPoint",
        description: `Wallet Top-Up ₹${topUpAmount}`,
        handler: async function (response: any) {
          try {
            const success = await topUpWallet(topUpAmount, response.razorpay_payment_id);
            if (success) {
              toast.success(`Successfully added ₹${topUpAmount} to your wallet!`);
              setIsTopUpOpen(false);
            } else {
              toast.error("Payment received but failed to update wallet.");
            }
          } catch (err) {
            toast.error("Wallet update error after payment.");
          } finally {
            setIsToppingUp(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone.replace(/\s/g, ''),
        },
        theme: { color: "#10b981" },
        modal: { ondismiss: function() { setIsToppingUp(false); } },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`);
        setIsToppingUp(false);
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e.message || "An error occurred starting checkout.");
      setIsToppingUp(false);
    }
  };

  // --- SECURITY CHECK ---
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center bg-background">
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
          <User className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-[1.2rem] font-bold text-slate-900">Sign in to PlugPoint</h2>
        <p className="text-[0.85rem] text-slate-400 mt-1.5 max-w-[260px]">
          Access your bookings, manage chargers, and start earning
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="mt-5 px-8 py-3 bg-primary text-white rounded-xl text-[0.9rem] font-bold shadow-lg shadow-primary/20"
        >
          Sign In
        </button>
      </div>
    );
  }

  // --- DATA CALCULATIONS ---
  const userChargers = chargers.filter((c) => c.ownerId === user.id);
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const totalSpent = bookings.filter((b) => b.status === "completed").reduce((sum, b) => sum + b.totalCost, 0);
  const upcomingBookings = bookings.filter((b) => b.status === "upcoming").length;
  const userReviews = reviews.filter((r) => r.userId === user.id).length;
  const isSuperhost = user.rating >= 4.5 && userChargers.length > 0;

  // Get user initials for avatar fallback
  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-[#f5f5f5] min-h-full pb-8" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ═══════════════════════════════════════════
          LIGHT GREEN GRADIENT HEADER (Statiq style)
          ═══════════════════════════════════════════ */}
      <div
        style={{
          background: "linear-gradient(160deg, #c8f0d8 0%, #a8e6c0 40%, #d4f4e2 100%)",
          position: "relative",
          overflow: "hidden",
          paddingBottom: "24px",
        }}
      >
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", right: "-20px", bottom: "-10px",
          width: "140px", height: "140px",
          background: "radial-gradient(circle, #4ade8060 0%, transparent 70%)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", right: "30px", bottom: "10px",
          width: "80px", height: "80px",
          background: "radial-gradient(circle, #86efac50 0%, transparent 70%)",
          borderRadius: "50%",
        }} />

        {/* Top row: back arrow (spacer) + avatar + info + edit icon */}
        <div style={{ padding: "20px 16px 0 16px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {/* Circular Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: "58px", height: "58px", borderRadius: "50%",
                border: "2.5px solid #16a34a",
                overflow: "hidden",
                background: "#dcfce7",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 12px rgba(22,163,74,0.25)",
              }}>
                {user.avatar && !avatarError ? (
                  <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setAvatarError(true)} />
                ) : (
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#16a34a" }}>{initials}</span>
                )}
              </div>
              {user.verified && (
                <div style={{
                  position: "absolute", bottom: "-1px", right: "-1px",
                  width: "18px", height: "18px", borderRadius: "50%",
                  background: "#16a34a", border: "2px solid white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Shield style={{ width: "10px", height: "10px", color: "white" }} />
                </div>
              )}
            </div>

            {/* Name / email / phone */}
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#1a2e1a", lineHeight: 1.3 }}>
                {user.name}
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#2d6a2d", fontWeight: 500 }}>
                {user.email}
              </p>
              <p style={{ margin: "1px 0 0", fontSize: "0.72rem", color: "#2d6a2d", fontWeight: 500 }}>
                {user.phone || ""}
              </p>
            </div>

            {/* Edit icon (pencil) */}
            <button
              onClick={() => setIsEditProfileOpen(true)}
              style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(22,163,74,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
              }}
            >
              <Pencil style={{ width: "16px", height: "16px", color: "#16a34a" }} />
            </button>
          </div>

          {/* "Your GREEN journey starts today" banner */}
          <div style={{
            marginTop: "16px",
            background: "rgba(255,255,255,0.45)",
            borderRadius: "14px",
            padding: "12px 14px",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.6)",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "#14532d" }}>
                Your GREEN journey starts today 🌿
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "0.68rem", color: "#166534", fontWeight: 500 }}>
                Every charge counts for a greener Earth
              </p>
            </div>
            {/* Leaf/nature emoji icon */}
            <span style={{ fontSize: "1.8rem" }}>🌳</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          DARK PROMO / WALLET CARD
          ═══════════════════════════════════════════ */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
          borderRadius: "16px",
          padding: "14px 16px",
          display: "flex", alignItems: "center", gap: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "#fbbf24", letterSpacing: "0.01em" }}>
              PlugPoint WALLET
            </p>
            <p style={{ margin: "3px 0 0", fontSize: "0.65rem", color: "rgba(255,255,255,0.55)", fontWeight: 500, lineHeight: 1.4 }}>
              Use wallet for seamless, one-tap booking payments
            </p>
          </div>
          <button
            onClick={() => setIsTopUpOpen(true)}
            style={{
              background: "linear-gradient(135deg, #d4a017 0%, #b8860b 100%)",
              color: "white", border: "none",
              borderRadius: "10px", padding: "8px 14px",
              fontSize: "0.7rem", fontWeight: 700,
              cursor: "pointer", flexShrink: 0,
              boxShadow: "0 2px 8px rgba(212,160,23,0.4)",
            }}
          >
            Add Credits
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          3 QUICK ACTION ICONS
          ═══════════════════════════════════════════ */}
      <div style={{
        margin: "14px 14px 0",
        background: "white",
        borderRadius: "16px",
        padding: "14px 8px",
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
      }}>
        {[
          { icon: CalendarDays, label: "Sessions", onClick: () => navigate("/bookings") },
          { icon: Tag, label: "Offers", onClick: () => toast.info("Offers & deals coming soon!") },
          { icon: HelpCircle, label: "Help", onClick: () => toast.info("Help & support coming soon!") },
        ].map(({ icon: Icon, label, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: "6px",
              background: "transparent", border: "none",
              cursor: "pointer", padding: "4px 0",
            }}
          >
            <div style={{
              width: "44px", height: "44px",
              background: "#f0fdf4",
              borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #dcfce7",
            }}>
              <Icon style={{ width: "20px", height: "20px", color: "#15803d" }} />
            </div>
            <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#1a2e1a" }}>{label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          WALLET BALANCE ROW
          ═══════════════════════════════════════════ */}
      <div style={{ margin: "12px 14px 0" }}>
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "14px 16px",
          display: "flex", alignItems: "center", gap: "12px",
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}>
          <div style={{
            width: "42px", height: "42px",
            background: "#f0fdf4",
            borderRadius: "12px",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid #dcfce7", flexShrink: 0,
          }}>
            <Wallet style={{ width: "20px", height: "20px", color: "#16a34a" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#1a2e1a" }}>
              ₹ {(user.walletBalance || 0).toFixed(2)}
            </p>
            <p style={{ margin: "1px 0 0", fontSize: "0.67rem", color: "#6b7280", fontWeight: 500 }}>
              Total Balance
            </p>
          </div>
          <button
            onClick={() => setIsTopUpOpen(true)}
            style={{
              background: "transparent",
              border: "1.5px solid #16a34a",
              color: "#16a34a",
              borderRadius: "10px", padding: "7px 14px",
              fontSize: "0.72rem", fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Add Credits
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          MANAGE SECTION
          ═══════════════════════════════════════════ */}
      <div style={{ margin: "20px 14px 0" }}>
        <h2 style={{ margin: "0 0 10px 2px", fontSize: "0.95rem", fontWeight: 700, color: "#1a2e1a" }}>
          Manage
        </h2>
        <div style={{
          background: "white", borderRadius: "16px",
          overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}>
          {[
            {
              icon: Car,
              label: "Vehicle",
              badge: activeVehicle ? activeVehicle.modelName : undefined,
              onClick: () => setIsEvSetupOpen(true),
            },
            {
              icon: PlugZap,
              label: "My Chargers",
              badge: userChargers.length > 0 ? `${userChargers.length} listed` : undefined,
              isNew: userChargers.length === 0,
              onClick: () => navigate(userChargers.length > 0 ? "/manage-chargers" : "/list-charger"),
            },
            {
              icon: CreditCard,
              label: "Earnings",
              badge: undefined,
              onClick: () => navigate("/host-earnings"),
            },
            {
              icon: Award,
              label: "Host Level",
              badge: isSuperhost ? "Superhost ⭐" : "Standard",
              onClick: () => toast.info("Host levels are assigned automatically."),
            },
          ].map((item, i, arr) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                style={{
                  display: "flex", alignItems: "center",
                  width: "100%", padding: "14px 16px",
                  background: "transparent", border: "none",
                  borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none",
                  cursor: "pointer", textAlign: "left", gap: "14px",
                }}
              >
                <div style={{
                  width: "34px", height: "34px", borderRadius: "10px",
                  background: "#f0fdf4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon style={{ width: "17px", height: "17px", color: "#16a34a" }} />
                </div>
                <span style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600, color: "#1a2e1a" }}>
                  {item.label}
                </span>
                {item.isNew && (
                  <span style={{
                    background: "#ef4444", color: "white",
                    fontSize: "0.6rem", fontWeight: 700,
                    padding: "2px 7px", borderRadius: "20px",
                    letterSpacing: "0.02em",
                  }}>New</span>
                )}
                {item.badge && !item.isNew && (
                  <span style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 500, marginRight: "2px" }}>
                    {item.badge}
                  </span>
                )}
                <ChevronRight style={{ width: "16px", height: "16px", color: "#d1d5db", flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          STATIONS SECTION
          ═══════════════════════════════════════════ */}
      <div style={{ margin: "20px 14px 0" }}>
        <h2 style={{ margin: "0 0 10px 2px", fontSize: "0.95rem", fontWeight: 700, color: "#1a2e1a" }}>
          Stations
        </h2>
        <div style={{
          background: "white", borderRadius: "16px",
          overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}>
          {[
            {
              icon: PlugZap,
              label: "List a Charger",
              onClick: () => navigate("/list-charger"),
            },
            {
              icon: Lock,
              label: "My Bookings",
              badge: upcomingBookings > 0 ? `${upcomingBookings} upcoming` : undefined,
              onClick: () => navigate("/bookings"),
            },
            {
              icon: Bookmark,
              label: "Messages",
              onClick: () => navigate("/messages"),
            },
          ].map((item, i, arr) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                style={{
                  display: "flex", alignItems: "center",
                  width: "100%", padding: "14px 16px",
                  background: "transparent", border: "none",
                  borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none",
                  cursor: "pointer", textAlign: "left", gap: "14px",
                }}
              >
                <div style={{
                  width: "34px", height: "34px", borderRadius: "10px",
                  background: "#f0fdf4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon style={{ width: "17px", height: "17px", color: "#16a34a" }} />
                </div>
                <span style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600, color: "#1a2e1a" }}>
                  {item.label}
                </span>
                {"badge" in item && item.badge && (
                  <span style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 500, marginRight: "2px" }}>
                    {item.badge}
                  </span>
                )}
                <ChevronRight style={{ width: "16px", height: "16px", color: "#d1d5db", flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── SIGN OUT ─── */}
      <div style={{ margin: "24px 14px 0" }}>
        <button
          onClick={async () => {
            try {
              await logout();
              navigate("/auth");
            } catch (error) {
              console.error("Logout error:", error);
            }
          }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "8px", width: "100%", padding: "13px",
            background: "white", border: "1.5px solid #fee2e2",
            borderRadius: "14px", color: "#ef4444",
            fontSize: "0.85rem", fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          }}
        >
          <LogOut style={{ width: "16px", height: "16px" }} />
          Sign Out
        </button>
      </div>

      <p style={{
        textAlign: "center", fontSize: "0.62rem",
        color: "#d1d5db", marginTop: "20px", paddingBottom: "8px",
        fontWeight: 500,
      }}>
        PlugPoint v1.0.0 • Peer-to-Peer EV Charging
      </p>

      {/* ═══════════════ TOP-UP MODAL ═══════════════ */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !isToppingUp && setIsTopUpOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-bold text-[1.1rem]">Top Up Wallet</h3>
              </div>
              <button onClick={() => !isToppingUp && setIsTopUpOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-500 text-[0.85rem] mb-4">
              Add funds to your PlugPoint wallet for seamless, one-tap booking. Current balance: <strong className="text-slate-800">₹{user.walletBalance || 0}</strong>
            </p>
            <div className="mb-4">
              <label className="text-[0.8rem] font-bold text-slate-600 mb-1 block">Amount (₹)</label>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                min="50"
              />
            </div>
            <div className="flex gap-2 mb-5">
              {[100, 500, 1000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className={`flex-1 py-1.5 rounded-lg text-[0.8rem] font-bold border transition-colors ${
                    topUpAmount === amt ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <button
              onClick={handleTopUp}
              disabled={isToppingUp || topUpAmount < 50}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 flex justify-center items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isToppingUp ? <><Loader2 className="w-5 h-5 animate-spin" />Processing...</> : `Pay ₹${topUpAmount}`}
            </button>
          </div>
        </div>
      )}

      {/* EV SETUP MODAL */}
      <EvSetupModal isOpen={isEvSetupOpen} onClose={() => setIsEvSetupOpen(false)} />

      {/* PROFILE EDIT MODAL */}
      <ProfileEditModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
    </div>
  );
}