import { useState } from "react";
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
  const { isAuthenticated, user } = useApp();
  const { totalUnread } = useConversations();
  const [avatarError, setAvatarError] = useState(false);
  
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
            className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity active:scale-95"
          >
            {user?.avatar && !avatarError ? (
              <img 
                src={user.avatar} 
                alt="" 
                className="w-full h-full rounded-full object-cover shadow-sm border border-slate-200" 
                onError={() => setAvatarError(true)} 
              />
            ) : (
              <svg viewBox="0 0 24 24" className="w-11 h-11 text-slate-800" fill="currentColor">
                 <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" clipRule="evenodd" />
              </svg>
            )}
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
        <nav className="sticky bottom-0 z-50 bg-white/95 backdrop-blur-3xl border-t border-slate-100/50 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-around max-w-lg mx-auto py-1">
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
                className={`flex flex-col items-center justify-center py-2 px-3 min-w-[4.8rem] rounded-2xl transition-all relative ${
                  isPlusButton ? "" : isActive ? "text-primary scale-105" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                }`}
              >
                {/* Special design for the 'List Charger' button */}
                {isPlusButton ? (
                  <div className="w-13 h-13 -mt-9 bg-primary/10 rounded-3xl p-1 shadow-lg shadow-primary/20">
                    <div className="w-full h-full bg-primary rounded-2xl flex items-center justify-center border border-white/20 active:scale-90 transition-transform">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "stroke-[2.5px] drop-shadow-sm" : "stroke-[2px]"}`} />
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
