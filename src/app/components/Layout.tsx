import { Outlet, useLocation, useNavigate } from "react-router";
import { Toaster } from "sonner";
import {
  MapPin,
  Search,
  CalendarDays,
  User,
  Zap,
  Plus,
  MessageCircle,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useConversations } from "../../hooks/useConversations";

// This list defines our bottom navigation bar
const navItems = [
  { path: "/", icon: Search, label: "Discover" },
  { path: "/map", icon: MapPin, label: "Map" },
  { path: "/list-charger", icon: Plus, label: "List" },
  { path: "/bookings", icon: CalendarDays, label: "Bookings" },
  { path: "/messages", icon: MessageCircle, label: "Messages" },
  { path: "/profile", icon: User, label: "Profile" },
];

/**
 * --- THE LAYOUT COMPONENT ---
 * This is the "Frame" of the entire app. It contains:
 * 1. The Header at the top (with the Logo)
 * 2. The Main Content area in the middle (where pages swap in and out)
 * 3. The Navigation Bar at the bottom
 */
export function Layout() {
  const location = useLocation(); // Keeps track of which URL we are currently on
  const navigate = useNavigate(); // Lets us programmatically change the URL
  const { isAuthenticated } = useApp();
  const { totalUnread } = useConversations();
  
  // Some pages (like Charger Detail) have their own special bottom bars.
  // We want to HIDE the global bottom navigation on those pages to avoid overlaps.
  const isChargerDetail = location.pathname.startsWith("/charger/");
  const isAuthPage = location.pathname === "/auth";
  const hideNavBar = isChargerDetail || isAuthPage;

  return (
    // h-screen: makes the app exactly the height of the phone screen
    <div className="flex flex-col h-screen bg-slate-50 selection:bg-primary/30">
      
      {/* ─── APP HEADER ─── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform" onClick={() => navigate("/")}>
          {/* Main Logo Icon */}
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-[1.2rem] tracking-tighter" style={{ fontWeight: 900 }}>
            PlugPoint
          </span>
        </div>

        {/* User Profile / sign-in button */}
        {isAuthenticated ? (
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <User className="w-5 h-5 text-slate-400" />
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="px-5 py-2 bg-primary text-white rounded-xl text-[0.8rem] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            Sign In
          </button>
        )}
      </header>

      {/* ─── MAIN CONTENT AREA ─── */}
      {/* flex-1: takes up all the space between the header and nav bar */}
      {/* overflow-y-auto: allows the content to scroll while the header/nav stay fixed */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        {/* <Outlet /> is a placeholder. React Router replaces this with 
            whatever page (Home, Map, etc.) matches the current URL. */}
        <Outlet />
      </main>

      {/* ─── BOTTOM NAVIGATION BAR ─── */}
      {/* Only show if we are NOT on a special page that hides it */}
      {!hideNavBar && (
        <nav className="sticky bottom-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            // Check if this nav item matches the current page we are on
            const isActive =
              location.pathname === item.path ||
              (item.path === "/" && location.pathname === "/");
            
            const Icon = item.icon;
            const isPlusButton = item.label === "List"; // Special formatting for the center "Plus" button

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center py-2 px-3 min-w-[4.5rem] transition-all relative ${
                  isPlusButton ? "" : isActive ? "text-primary scale-110" : "text-slate-300"
                }`}
              >
                {/* Special design for the 'List Charger' button */}
                {isPlusButton ? (
                  <div className="w-12 h-12 -mt-8 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 border-4 border-white active:scale-90 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
                )}
                
                {/* Red badge for unread messages */}
                {item.label === "Messages" && totalUnread > 0 && (
                  <div className="absolute top-1 right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-[0.55rem] font-black text-white">{totalUnread > 9 ? "9+" : totalUnread}</span>
                  </div>
                )}
                
                {/* The Label Text */}
                <span
                  className={`text-[0.65rem] mt-1.5 font-black uppercase tracking-widest ${
                    isPlusButton ? "text-primary" : isActive ? "text-primary opacity-100" : "text-slate-300 opacity-60"
                  }`}
                >
                  {item.label}
                </span>
                
                {/* Small DOT indicator for active non-plus items */}
                {!isPlusButton && isActive && (
                  <div className="absolute top-1.5 right-4 w-1.5 h-1.5 bg-primary rounded-full animate-in fade-in zoom-in duration-300" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
      )}

      {/* This component shows temporary alerts (like "Booking Confirmed!") at the top */}
      <Toaster position="top-center" expand={true} richColors />
    </div>
  );
}
