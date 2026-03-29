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
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, bookings, chargers, reviews } = useApp();

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-[1.25rem]" style={{ fontWeight: 700 }}>Sign in to PlugPoint</h2>
        <p className="text-[0.875rem] text-muted-foreground mt-1">
          Access your bookings, manage chargers, and more
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-[0.9375rem]"
        >
          Sign In
        </button>
      </div>
    );
  }

  const userChargers = chargers.filter((c) => c.ownerId === user.id);
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const totalSpent = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + b.totalCost, 0);

  const upcomingBookings = bookings.filter((b) => b.status === "upcoming").length;
  const userReviews = reviews.filter((r) => r.userId === user.id).length;
  
  const hostBookings = bookings.filter((b) => 
    userChargers.some((c) => c.id === b.chargerId) && b.status === "completed"
  );
  const hostEarnings = hostBookings.reduce((sum, b) => sum + b.totalCost, 0);
  const isSuperhost = user.rating >= 4.5 && userChargers.length > 0;

  const menuSections = [
    {
      title: "Account",
      items: [
        { icon: CreditCard, label: "Wallet Balance", detail: "₹0.00", onClick: () => toast.info("Wallet & Payments integration coming soon!") },
        { icon: Bell, label: "Active Bookings", detail: upcomingBookings > 0 ? `${upcomingBookings} upcoming` : "None", onClick: () => navigate("/bookings") },
        { icon: Heart, label: "My Reviews", detail: `${userReviews} reviews`, onClick: () => toast.info("Reviews management coming soon!") },
      ],
    },
    {
      title: "Host",
      items: [
        { icon: Zap, label: "My Chargers", detail: `${userChargers.length} listed`, onClick: () => navigate("/list-charger") },
        { icon: CalendarDays, label: "Host Earnings", detail: `₹${hostEarnings.toLocaleString()}`, onClick: () => toast.info("Detailed earnings dashboard coming soon!") },
        { icon: Award, label: "Host Level", detail: isSuperhost ? "Superhost" : "Standard Host", onClick: () => toast.info("Host levels are assigned automatically based on ratings.") },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", detail: "", onClick: () => toast.info("Help Center coming soon!") },
        { icon: Settings, label: "Settings", detail: "", onClick: () => toast.info("App Settings coming soon!") },
      ],
    },
  ];

  return (
    <div className="pb-4">
      {/* Profile Header */}
      <div className="px-4 pt-4 pb-5 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-16 h-16 rounded-full border-2 border-white shadow-md"
          />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[1.125rem]" style={{ fontWeight: 700 }}>{user.name}</h1>
              {user.verified && <Shield className="w-4 h-4 text-primary" />}
            </div>
            <p className="text-[0.8125rem] text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[0.75rem]" style={{ fontWeight: 500 }}>
                {user.rating} rating
              </span>
              <span className="text-[0.75rem] text-muted-foreground">
                - Member since {user.joinedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "Bookings", value: completedBookings.toString() },
            { label: "Chargers", value: user.chargersListed.toString() },
            { label: "Total Spent", value: `₹${totalSpent.toFixed(0)}` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center p-3 bg-white rounded-xl border border-border"
            >
              <span className="text-[1.125rem] text-primary" style={{ fontWeight: 700 }}>
                {stat.value}
              </span>
              <span className="text-[0.6875rem] text-muted-foreground mt-0.5">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Badge */}
      <div className="mx-4 mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-[0.8125rem]" style={{ fontWeight: 600 }}>Identity Verified</p>
          <p className="text-[0.6875rem] text-muted-foreground">
            Email, phone, and ID verified
          </p>
        </div>
        <div className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[0.6875rem]" style={{ fontWeight: 500 }}>
          Verified
        </div>
      </div>

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <div key={section.title} className="mt-4">
          <h3 className="px-4 text-[0.75rem] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontWeight: 600 }}>
            {section.title}
          </h3>
          <div className="mx-4 bg-white rounded-xl border border-border overflow-hidden">
            {section.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`flex items-center gap-3 w-full px-3 py-3 text-left hover:bg-muted/50 transition-colors ${
                    i < section.items.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="flex-1 text-[0.8125rem]">{item.label}</span>
                  {item.detail && (
                    <span className="text-[0.75rem] text-muted-foreground mr-1">
                      {item.detail}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Logout */}
      <div className="px-4 mt-6">
        <button
          onClick={async () => {
            try {
              await logout();
              navigate("/auth");
            } catch (error) {
              console.error("Logout error:", error);
            }
          }}
          className="flex items-center justify-center gap-2 w-full py-2.5 border border-destructive text-destructive rounded-xl text-[0.875rem]"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <p className="text-center text-[0.6875rem] text-muted-foreground mt-4 pb-2">
        PlugPoint v1.0.0 - MVP
      </p>
    </div>
  );
}