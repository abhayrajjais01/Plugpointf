import { useState } from "react";
import { useNavigate } from "react-router";
import {
  User,
  Shield,
  Star,
  MapPin,
  CalendarDays,
  Zap,
  ChevronRight,
  LogOut,
  Settings,
  HelpCircle,
  Bell,
  CreditCard,
  Heart,
  MessageCircle,
  Award,
  Car,
  Battery,
  X,
  Loader2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

declare var Razorpay: any;

/**
 * --- THE PROFILE PAGE ---
 * This screen displays the user's personal info, their stats 
 * (like how much they've spent or how many chargers they own), 
 * and a menu for settings and support.
 */
export function ProfilePage() {
  const navigate = useNavigate();
  const [avatarError, setAvatarError] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(500);
  const [isToppingUp, setIsToppingUp] = useState(false);
  
  // We pull everything about the current user from our global AppContext
  const { user, isAuthenticated, logout, bookings, chargers, reviews, topUpWallet } = useApp();

  const handleTopUp = async () => {
    if (!user) return;
    setIsToppingUp(true);
    try {
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!razorpayKeyId) {
        throw new Error("Razorpay is not configured. Please add VITE_RAZORPAY_KEY_ID to your .env file.");
      }

      // Open Razorpay checkout directly (no server-side order creation needed)
      const options = {
        key: razorpayKeyId,
        amount: topUpAmount * 100, // Razorpay expects paise
        currency: "INR",
        name: "PlugPoint",
        description: `Wallet Top-Up ₹${topUpAmount}`,
        handler: async function (response: any) {
          // This fires ONLY on successful payment
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
        theme: {
          color: "#10b981",
        },
        modal: {
          ondismiss: function() {
            setIsToppingUp(false);
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response: any){
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
  // If the user isn't logged in, we show a "Please Sign In" empty state
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

  // --- MENU DATA ---
  const menuSections = [
    {
      title: "Account",
      items: [
        { icon: CreditCard, label: "Wallet Balance", detail: `₹${user.walletBalance || 0}`, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600", onClick: () => setIsTopUpOpen(true) },
        { icon: Bell, label: "Active Bookings", detail: upcomingBookings > 0 ? `${upcomingBookings} upcoming` : "None", iconBg: "bg-blue-500/10", iconColor: "text-blue-600", onClick: () => navigate("/bookings") },
        { icon: Heart, label: "My Reviews", detail: `${userReviews} reviews`, iconBg: "bg-pink-500/10", iconColor: "text-pink-600", onClick: () => toast.info("Reviews management coming soon!") },
        { icon: MessageCircle, label: "Messages", detail: "", iconBg: "bg-purple-500/10", iconColor: "text-purple-600", onClick: () => navigate("/messages") },
      ],
    },
    {
      title: "Host",
      items: [
        { 
          icon: Zap, 
          label: "My Chargers", 
          detail: `${userChargers.length} listed`, 
          iconBg: "bg-amber-500/10", 
          iconColor: "text-amber-600", 
          onClick: () => navigate(userChargers.length > 0 ? "/manage-chargers" : "/list-charger") 
        },
        { icon: Award, label: "Host Level", detail: isSuperhost ? "Superhost ⭐" : "Standard", iconBg: "bg-primary/10", iconColor: "text-primary", onClick: () => toast.info("Host levels are assigned automatically.") },
      ],
    },
  ];

  return (
    <div className="pb-6 bg-background min-h-full">
      
      {/* ═══════════════════════════════════════════
          DARK GRADIENT PROFILE HEADER
          ═══════════════════════════════════════════ */}
      <div className="header-gradient relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        
        <div className="relative z-10 px-5 pt-6 pb-6">
          {/* Profile Info Row */}
          <div className="flex items-center gap-4">
            {/* Avatar with green ring */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-400/30 shadow-lg">
                {user.avatar && !avatarError ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-white/60" />
                  </div>
                )}
              </div>
              {user.verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center border-2 border-[#152238]">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-white text-[1.15rem]" style={{ fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.2 }}>{user.name}</h1>
              <p className="text-white/40 text-[0.75rem] mt-0.5 font-medium">{user.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1 px-2 py-0.5 bg-white/8 rounded-md">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[0.7rem] font-semibold text-white/80">{user.rating}</span>
                </div>
                <span className="text-[0.65rem] text-white/30 font-medium">Since {user.joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { label: "Bookings", value: completedBookings.toString() },
              { label: "Chargers", value: userChargers.length.toString() },
              { label: "Spent", value: `₹${totalSpent.toFixed(0)}` },
            ].map((stat) => (
              <div key={stat.label}
                className="flex flex-col items-center p-3 bg-white/5 rounded-xl border border-white/5"
              >
                <span className="text-[1.1rem] text-emerald-400 font-bold">{stat.value}</span>
                <span className="text-[0.6rem] text-white/30 mt-0.5 font-bold uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          MY VEHICLE CARD
          ═══════════════════════════════════════════ */}
      <div className="mx-4 -mt-3 relative z-10">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
            <Car className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1">
            <p className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider">My Vehicle</p>
            <p className="text-[0.85rem] font-bold text-slate-900">Add your EV</p>
          </div>
          <button className="px-3 py-1.5 bg-primary/8 text-primary rounded-lg text-[0.7rem] font-bold hover:bg-primary/15 transition-colors">
            Setup
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          SUPERHOST BADGE (if applicable)
          ═══════════════════════════════════════════ */}
      {isSuperhost && (
        <div className="mx-4 mt-3">
          <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100/50 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-sm">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[0.85rem] font-bold text-amber-900">Superhost Status</p>
              <p className="text-[0.7rem] text-amber-700/60 font-medium mt-0.5">Top-rated host with outstanding service</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          MENU SECTIONS
          ═══════════════════════════════════════════ */}
      {menuSections.map((section) => (
        <div key={section.title} className="mt-5">
          {/* Section Heading */}
          <h3 className="px-5 text-[0.65rem] text-slate-400 uppercase tracking-widest mb-2 font-bold">
            {section.title}
          </h3>
          <div className="mx-4 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            {section.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors ${
                    i < section.items.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <div className={`w-8 h-8 ${item.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${item.iconColor}`} />
                  </div>
                  <span className="flex-1 text-[0.85rem] font-semibold text-slate-700">{item.label}</span>
                  {item.detail && (
                    <span className="text-[0.7rem] text-slate-400 mr-1 font-medium">
                      {item.detail}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* ─── LOGOUT BUTTON ─── */}
      <div className="px-4 mt-8">
        <button
          onClick={async () => {
            try {
              await logout();
              navigate("/auth");
            } catch (error) {
              console.error("Logout error:", error);
            }
          }}
          className="flex items-center justify-center gap-2 w-full py-3 border border-red-100 text-red-500 rounded-xl text-[0.85rem] font-semibold hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <p className="text-center text-[0.65rem] text-slate-300 mt-6 pb-2 font-medium">
        PlugPoint v1.0.0 • Peer-to-Peer Charging
      </p>

      {/* TOP-UP MODAL */}
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
              {isToppingUp ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : `Pay ₹${topUpAmount}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}