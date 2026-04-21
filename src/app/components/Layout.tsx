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
  const isMapPage = location.pathname === "/map";
  const isHomePage = location.pathname === "/";
  const hideNavBar = isChargerDetail || isAuthPage;
  const hideHeader = isMapPage || isHomePage; // These pages have their own custom headers

  return (
    // h-[100dvh]: makes the app exactly the height of the phone screen, accounting for address bars
    <div className="flex flex-col h-[100dvh] bg-slate-50 selection:bg-primary/30">
      
      {/* ─── APP HEADER ─── */}
      {!hideHeader && (
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform" onClick={() => navigate("/")}>
          {/* Main Logo Icon */}
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-[1.1rem] tracking-tight" style={{ fontWeight: 800 }}>
            PlugPoint
          </span>
        </div>

        {/* User Profile / sign-in button */}
        {isAuthenticated ? (
          <button
            onClick={() => navigate("/profile")}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity active:scale-95"
          >
            {user?.avatar && !avatarError ? (
              <img 
                src={user.avatar} 
                alt="" 
                className="w-full h-full rounded-full object-cover shadow-sm border-2 border-primary/20" 
                onError={() => setAvatarError(true)} 
              />
            ) : (
              <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
            )}
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="px-4 py-2 bg-primary text-white rounded-xl text-[0.75rem] font-bold uppercase tracking-wider shadow-md shadow-primary/20 hover:shadow-lg transition-shadow"
          >
            Sign In
          </button>
        )}
      </header>
      )}

      {/* ─── MAIN CONTENT AREA ─── */}
      {/* flex-1: takes up all the space between the header and nav bar */}
      {/* overflow-y-auto: allows the content to scroll while the header/nav stay fixed */}
      <main className={`flex-1 ${isMapPage ? 'overflow-hidden' : 'overflow-y-auto'} no-scrollbar`}>
        {/* <Outlet /> is a placeholder. React Router replaces this with 
            whatever page (Home, Map, etc.) matches the current URL. */}
        <Outlet />
      </main>

      {/* ─── BOTTOM NAVIGATION BAR ─── */}
      {/* Only show if we are NOT on a special page that hides it */}
      {!hideNavBar && (
        <nav className="sticky bottom-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-slate-100/80 nav-shadow">
        <div className="flex items-center justify-around max-w-lg mx-auto py-1.5 px-1">
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
                className={`flex flex-col items-center justify-center py-2 px-3 min-w-[4rem] rounded-2xl transition-all duration-200 relative ${
                  isPlusButton ? "" : isActive ? "text-primary" : "text-slate-400 hover:text-slate-500"
                }`}
              >
                {/* Special design for the 'List Charger' button */}
                {isPlusButton ? (
                  <div className="w-12 h-12 -mt-7 rounded-2xl p-0.5 bg-gradient-to-br from-primary to-emerald-400 shadow-lg shadow-primary/25">
                    <div className="w-full h-full bg-primary rounded-[14px] flex items-center justify-center active:scale-90 transition-transform">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Icon className={`w-[22px] h-[22px] transition-all duration-200 ${
                      isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"
                    }`} />
                    {/* Active indicator dot */}
                    {isActive && (
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                    )}
                  </div>
                )}
                
                {/* Red badge for unread messages */}
                {item.label === "Messages" && totalUnread > 0 && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-[0.5rem] font-black text-white">{totalUnread > 9 ? "9+" : totalUnread}</span>
                  </div>
                )}
                
                {/* The Label Text */}
                <span
                  className={`text-[0.6rem] mt-1 tracking-wide transition-all duration-200 ${
                    isPlusButton 
                      ? "text-primary font-bold" 
                      : isActive 
                        ? "text-primary font-bold opacity-100" 
                        : "text-slate-400 font-medium opacity-70"
                  }`}
                >
                  {item.label}
                </span>
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
