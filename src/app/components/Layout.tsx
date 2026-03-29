import { Outlet, useLocation, useNavigate } from "react-router";
import { Toaster } from "sonner";
import {
  MapPin,
  Search,
  CalendarDays,
  User,
  Zap,
  Plus,
} from "lucide-react";
import { useApp } from "../context/AppContext";

const navItems = [
  { path: "/", icon: Search, label: "Discover" },
  { path: "/map", icon: MapPin, label: "Map" },
  { path: "/list-charger", icon: Plus, label: "List" },
  { path: "/bookings", icon: CalendarDays, label: "Bookings" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useApp();

  return (
    <div className="flex flex-col h-screen bg-background">
      <Toaster position="top-center" />
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-[1.125rem] tracking-tight" style={{ fontWeight: 700 }}>
            PlugPoint
          </span>
        </div>
        {isAuthenticated ? (
          <button
            onClick={() => navigate("/profile")}
            className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <User className="w-4 h-4 text-primary" />
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-[0.875rem]"
          >
            Sign In
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 z-50 bg-white border-t border-border px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === "/" && location.pathname === "/");
            const Icon = item.icon;
            const isList = item.label === "List";

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center py-2 px-3 min-w-[4rem] transition-colors ${
                  isList ? "" : isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {isList ? (
                  <div className="w-10 h-10 -mt-5 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                <span
                  className={`text-[0.6875rem] mt-0.5 ${isList ? "text-primary" : ""}`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
