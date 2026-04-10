import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  MapPin,
  Zap,
  Shield,
  Clock,
  ChevronRight,
  SlidersHorizontal,
  X,
  Bolt,
  IndianRupee,
  Star,
  Navigation,
  Sparkles,
  TrendingUp,
  ChevronDown,
  Gift,
  User,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ChargerCard } from "./ChargerCard";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// --- MATH HELPER ---
// Haversine formula: calculates real-world distance between two GPS points in kilometers.
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Standard options for the user to choose from
const connectorTypes = ["All", "J1772", "CCS", "Tesla Wall Connector"];
const sortOptions = ["Nearest", "Price: Low", "Price: High", "Top Rated"];

/**
 * --- THE HOME PAGE ---
 * This is the first screen users see. It's designed to help them
 * find a charger quickly using a search bar, filters, and a list 
 * of nearby stations.
 */
export function HomePage() {
  // We grab the list of chargers from our global AppContext
  const { chargers, isAuthenticated, user, userLocation } = useApp();
  const navigate = useNavigate();

  // --- UI STATE ---
  // These 'useState' hooks remember what the user has typed or clicked.
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConnector, setSelectedConnector] = useState("All");
  const [showFilters, setShowFilters] = useState(false); // Controls the slide-down filter panel
  const [sortBy, setSortBy] = useState("Nearest");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [powerLevel, setPowerLevel] = useState("All");
  const [minRating, setMinRating] = useState("All");
  const [priceRange, setPriceRange] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const activeFilterCount = [
    selectedConnector !== "All",
    sortBy !== "Nearest",
    onlyAvailable,
    powerLevel !== "All",
    minRating !== "All",
    priceRange !== "All",
    verifiedOnly,
  ].filter(Boolean).length;

  // --- FILTERING LOGIC ---
  // This takes the master list of chargers and narrows it down 
  // based on what the user is looking for.
  const filtered = chargers
    .filter((c) => {
      // 1. Search by name, address, or city
      const matchesSearch =
        !searchQuery ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Filter by plug type (e.g. only show CCS)
      const matchesConnector =
        selectedConnector === "All" || c.connectorType === selectedConnector;
      
      // 3. Optional: hide chargers that are currently busy
      const matchesAvailable = !onlyAvailable || c.available;
      const matchesPower =
        powerLevel === "All" ||
        (powerLevel === "Level 1" && c.power <= 2) ||
        (powerLevel === "Level 2" && c.power > 2 && c.power <= 22) ||
        (powerLevel === "DC Fast" && c.power > 22);
      const matchesRating =
        minRating === "All" ||
        (minRating === "3+" && c.rating >= 3) ||
        (minRating === "4+" && c.rating >= 4) ||
        (minRating === "4.5+" && c.rating >= 4.5);
      const matchesPrice =
        priceRange === "All" ||
        (priceRange === "Budget" && c.pricePerHour <= 80) ||
        (priceRange === "Mid" && c.pricePerHour > 80 && c.pricePerHour <= 120) ||
        (priceRange === "Premium" && c.pricePerHour > 120);
      const matchesVerified = !verifiedOnly || c.verified;
      return (
        matchesSearch &&
        matchesConnector &&
        matchesAvailable &&
        matchesPower &&
        matchesRating &&
        matchesPrice &&
        matchesVerified
      );
    })
    // 4. Sort the results (e.g. cheapest first, or nearest by GPS distance)
    .sort((a, b) => {
      if (sortBy === "Price: Low") return a.pricePerHour - b.pricePerHour;
      if (sortBy === "Price: High") return b.pricePerHour - a.pricePerHour;
      if (sortBy === "Top Rated") return b.rating - a.rating;
      // Default "Nearest": sort by distance from user location
      if (userLocation) {
        const distA = getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const distB = getDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        return distA - distB;
      }
      return 0;
    });

  const availableCount = chargers.filter((c) => c.available).length;
  const topRated = [...chargers].sort((a, b) => b.rating - a.rating).slice(0, 5);
  const nearbyChargers = filtered.slice(0, 10);

  return (
    <div className="pb-4 bg-background">
      
      {/* ═══════════════════════════════════════════
          HERO HEADER WITH BACKGROUND IMAGE
          ═══════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-slate-900">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1765272088009-100c96a4cd4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMHN0YXRpb24lMjBtb2Rlcm58ZW58MXx8fHwxNzcxMzcwNTA2fDA&ixlib=rb-4.1.0&q=80&w=1080" 
            alt="EV Charger"
            className="w-full h-full object-cover opacity-60"
          />
          {/* Gradients to seamlessly blend the image into the UI */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-slate-900" />
        </div>
        
        <div className="relative z-10">
          {/* Top Row: Logo + Profile */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-white text-[1.1rem] tracking-tight" style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>
                  PlugPoint
                </h1>
                <p className="text-white/40 text-[0.6rem] font-semibold uppercase tracking-widest">Peer-to-Peer Charging</p>
              </div>
            </div>

            {/* Profile Avatar */}
            {isAuthenticated ? (
              <button onClick={() => navigate("/profile")} className="w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-400/30 active:scale-95 transition-transform">
                {user?.avatar && !avatarError ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-white/60" />
                  </div>
                )}
              </button>
            ) : (
              <button onClick={() => navigate("/auth")} className="px-3.5 py-1.5 bg-white/10 border border-white/10 text-white rounded-lg text-[0.7rem] font-bold backdrop-blur-sm hover:bg-white/15 transition-colors">
                Sign In
              </button>
            )}
          </div>

          {/* Greeting & Stats */}
          <div className="px-5 pt-2 pb-4">
            <h2 className="text-white text-[1.35rem]" style={{ fontWeight: 700, lineHeight: 1.25, fontSize: '1.35rem' }}>
              Find your next
              <br />
              <span className="gradient-text">charging stop</span>
            </h2>
            <p className="text-white/50 text-[0.8rem] mt-1.5 font-medium">
              {availableCount} chargers available nearby
            </p>
          </div>

          {/* Search Bar */}
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search stations, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-sm text-slate-800 placeholder-slate-400 outline-none shadow-sm"
                  style={{ fontSize: '13px' }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${
                  showFilters ? "bg-primary text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="w-4.5 h-4.5" />
                {activeFilterCount > 0 && !showFilters && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[0.5rem] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Quick Action Pills */}
          <div className="px-5 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => navigate("/map")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-[0.75rem] font-semibold whitespace-nowrap backdrop-blur-sm hover:bg-white/15 transition-all active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Nearby
            </button>
            <button 
              onClick={() => { setOnlyAvailable(true); setPowerLevel("DC Fast"); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-[0.75rem] font-semibold whitespace-nowrap backdrop-blur-sm hover:bg-white/15 transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Fast Charge
            </button>
            <button 
              onClick={() => navigate("/map?tab=trip")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-[0.75rem] font-semibold whitespace-nowrap backdrop-blur-sm hover:bg-white/15 transition-all active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              Plan Trip
            </button>
            <button 
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-[0.75rem] font-semibold whitespace-nowrap backdrop-blur-sm hover:bg-white/15 transition-all active:scale-95"
            >
              <Gift className="w-3.5 h-3.5 text-pink-400" />
              Offers
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          FILTERS PANEL (Slides down under search)
          ═══════════════════════════════════════════ */}
      {showFilters && (
        <div className="mx-4 mt-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[0.9375rem]" style={{ fontWeight: 600 }}>Filters</h3>
              {activeFilterCount > 0 && (
                <span className="bg-primary text-white text-[0.625rem] font-semibold px-1.5 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedConnector("All");
                setSortBy("Nearest");
                setOnlyAvailable(false);
                setPowerLevel("All");
                setMinRating("All");
                setPriceRange("All");
                setVerifiedOnly(false);
              }}
              className="text-[0.8125rem] text-primary font-semibold"
            >
              Reset all
            </button>
          </div>

          {/* Sort */}
          <div className="mb-3">
            <label className="text-[0.7rem] text-slate-400 mb-1.5 block font-bold uppercase tracking-wider">Sort By</label>
            <div className="flex flex-wrap gap-1.5">
              {sortOptions.map((opt) => (
                <button key={opt} onClick={() => setSortBy(opt)}
                  className={`px-3 py-1.5 rounded-lg text-[0.75rem] transition-colors font-medium ${
                    sortBy === opt ? "bg-primary text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >{opt}</button>
              ))}
            </div>
          </div>

          {/* Connector */}
          <div className="mb-3">
            <label className="text-[0.7rem] text-slate-400 mb-1.5 block font-bold uppercase tracking-wider">Connector</label>
            <div className="flex flex-wrap gap-1.5">
              {connectorTypes.map((type) => (
                <button key={type} onClick={() => setSelectedConnector(type)}
                  className={`px-3 py-1.5 rounded-lg text-[0.75rem] transition-colors font-medium ${
                    selectedConnector === type ? "bg-primary text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >{type}</button>
              ))}
            </div>
          </div>

          {/* Power Output */}
          <div className="mb-3 pt-3 border-t border-slate-100">
            <label className="text-[0.7rem] text-slate-400 mb-1.5 block font-bold uppercase tracking-wider">Power Output</label>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: "All", sub: "Any" },
                { label: "Level 1", sub: "≤2 kW" },
                { label: "Level 2", sub: "3–22 kW" },
                { label: "DC Fast", sub: "22kW+" },
              ].map(({ label, sub }) => (
                <button key={label} onClick={() => setPowerLevel(label)}
                  className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all min-w-[4rem] ${
                    powerLevel === label
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-[0.8rem] font-semibold leading-tight">{label}</span>
                  <span className={`text-[0.6rem] mt-0.5 ${powerLevel === label ? "text-white/70" : "text-slate-400"}`}>{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="mb-3 pt-3 border-t border-slate-100">
            <label className="text-[0.7rem] text-slate-400 mb-1.5 block font-bold uppercase tracking-wider">Minimum Rating</label>
            <div className="flex gap-1.5">
              {["All", "3+", "4+", "4.5+"].map((r) => (
                <button key={r} onClick={() => setMinRating(r)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-[0.8rem] font-medium transition-all ${
                    minRating === r
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100"
                  }`}
                >
                  {r !== "All" && <Star className={`w-3 h-3 ${minRating === r ? "text-white fill-white" : "text-amber-400 fill-amber-400"}`} />}
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-3 pt-3 border-t border-slate-100">
            <label className="text-[0.7rem] text-slate-400 mb-1.5 block font-bold uppercase tracking-wider">Price Range</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "All", sub: "Any price" },
                { label: "Budget", sub: "Up to ₹80/hr" },
                { label: "Mid", sub: "₹80–120/hr" },
                { label: "Premium", sub: "₹120+/hr" },
              ].map(({ label, sub }) => (
                <button key={label} onClick={() => setPriceRange(label)}
                  className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all ${
                    priceRange === label
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-[0.8rem] font-semibold">{label}</span>
                  <span className={`text-[0.6rem] mt-0.5 ${priceRange === label ? "text-white/70" : "text-slate-400"}`}>{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.8rem] font-semibold text-slate-700">Available now only</p>
                <p className="text-[0.7rem] text-slate-400 mt-0.5">Hide busy chargers</p>
              </div>
              <button onClick={() => setOnlyAvailable(!onlyAvailable)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                  onlyAvailable ? "bg-primary" : "bg-slate-200"
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  onlyAvailable ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.8rem] font-semibold text-slate-700">Verified hosts only</p>
                <p className="text-[0.7rem] text-slate-400 mt-0.5">Identity-verified hosts</p>
              </div>
              <button onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                  verifiedOnly ? "bg-primary" : "bg-slate-200"
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  verifiedOnly ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          INLINE STATS ROW
          ═══════════════════════════════════════════ */}
      <div className="flex gap-3 px-4 mt-4 overflow-x-auto no-scrollbar">
        {[
          { icon: Bolt, label: "Chargers", value: chargers.length.toString(), iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
          { icon: MapPin, label: "City", value: "Bangalore", iconBg: "bg-blue-500/10", iconColor: "text-blue-600" },
          { icon: IndianRupee, label: "From", value: "₹80/hr", iconBg: "bg-amber-500/10", iconColor: "text-amber-600" },
          { icon: Star, label: "Avg", value: "4.7★", iconBg: "bg-purple-500/10", iconColor: "text-purple-600" },
        ].map((stat) => (
          <div key={stat.label}
            className="flex items-center gap-2.5 px-3 py-2.5 bg-white rounded-xl border border-slate-100/80 flex-shrink-0 shadow-sm"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
              <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-[0.65rem] text-slate-400 font-medium">{stat.label}</p>
              <p className="text-[0.8rem] font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          TOP RATED — HORIZONTAL CAROUSEL
          ═══════════════════════════════════════════ */}
      <div className="mt-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <h2 className="text-[1rem] font-bold text-slate-900">Top Rated</h2>
          </div>
          <button className="text-[0.75rem] text-primary font-semibold flex items-center gap-0.5">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pl-4 pr-4">
          {topRated.map((charger) => (
            <button
              key={charger.id}
              onClick={() => navigate(`/charger/${charger.id}`)}
              className="flex-shrink-0 w-56 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden card-lift text-left"
            >
              {/* Image */}
              <div className="relative h-32 overflow-hidden">
                <ImageWithFallback src={charger.image} alt={charger.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                
                {/* Rating Badge */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-lg">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-[0.7rem] font-bold text-slate-800">{charger.rating}</span>
                </div>

                {/* Availability */}
                {charger.available && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-emerald-500 rounded-lg">
                    <span className="text-[0.6rem] font-bold text-white uppercase tracking-wider">Open</span>
                  </div>
                )}

                {/* Price */}
                <div className="absolute bottom-2.5 right-2.5">
                  <span className="text-white text-[0.9rem] font-black">₹{charger.pricePerHour}</span>
                  <span className="text-white/70 text-[0.65rem] font-medium">/hr</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-[0.8rem] font-bold text-slate-900 leading-tight line-clamp-1">{charger.title}</h3>
                <div className="flex items-center gap-1 text-slate-400 mt-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="text-[0.65rem] truncate font-medium">{charger.address}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="px-1.5 py-0.5 bg-slate-50 rounded text-[0.6rem] font-bold text-slate-500">{charger.power}kW</span>
                  <span className="px-1.5 py-0.5 bg-blue-50 rounded text-[0.6rem] font-bold text-blue-600">{charger.connectorType.replace("Wall Connector", "")}</span>
                  {charger.verified && <Shield className="w-3 h-3 text-emerald-500" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          EXPLORE ON MAP — Compact CTA
          ═══════════════════════════════════════════ */}
      <button
        onClick={() => navigate("/map")}
        className="mx-4 mt-5 w-[calc(100%-2rem)] flex items-center justify-between p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white shadow-lg group active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center group-hover:bg-primary/30 transition-colors">
            <MapPin className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-left">
            <p className="text-[0.85rem] font-bold">Explore on Map</p>
            <p className="text-[0.7rem] text-white/50 font-medium">View all {chargers.length} chargers nearby</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
      </button>

      {/* ═══════════════════════════════════════════
          ALL CHARGERS LIST
          ═══════════════════════════════════════════ */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="text-[1rem] font-bold text-slate-900">
              All Chargers
              <span className="text-slate-400 text-[0.8rem] ml-1.5 font-normal">({filtered.length})</span>
            </h2>
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Search className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-slate-600 text-[0.875rem] font-semibold">No chargers found</p>
            <p className="text-slate-400 text-[0.75rem] mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((charger) => (
              <ChargerCard key={charger.id} charger={charger} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}