import { useState } from "react";
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
  DollarSign,
  Star,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ChargerCard } from "./ChargerCard";
import { ImageWithFallback } from "./figma/ImageWithFallback";

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
  const { chargers } = useApp();
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
    // 4. Sort the results (e.g. cheapest first)
    .sort((a, b) => {
      if (sortBy === "Price: Low") return a.pricePerHour - b.pricePerHour;
      if (sortBy === "Price: High") return b.pricePerHour - a.pricePerHour;
      if (sortBy === "Top Rated") return b.rating - a.rating;
      return 0; // Default: keep database order
    });

  const availableCount = chargers.filter((c) => c.available).length;

  return (
    // pb-4: adds 'Padding-Bottom' so content doesn't touch the very bottom of the screen
    <div className="pb-4">
      
      {/* ─── HERO SECTION ─── */}
      {/* This is the big image at the top with the welcome text */}
      <div className="relative h-52 overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1765272088009-100c96a4cd4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMHN0YXRpb24lMjBtb2Rlcm58ZW58MXx8fHwxNzcxMzcwNTA2fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="EV Charging"
          className="w-full h-full object-cover" // object-cover: makes the image fill the box without stretching
        />
        {/* The dark overlay makes the white text easier to read on top of the image */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <h1 className="text-white text-[1.5rem]" style={{ fontWeight: 700, lineHeight: 1.2 }}>
            Find & share EV
            <br />
            chargers nearby
          </h1>
          <p className="text-white/80 text-[0.8125rem] mt-1">
            {availableCount} chargers available in Bangalore
          </p>
        </div>
      </div>

      {/* ─── SEARCH BAR ─── */}
      {/* -mt-5: pull the search bar UP so it overlaps the bottom of the hero image */}
      <div className="px-4 -mt-5 relative z-10">
        <div className="flex items-center gap-2">
          {/* flex-1: makes the search input take up all available horizontal space */}
          <div className="flex-1 flex items-center bg-white rounded-xl border border-border shadow-lg px-3 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <input
              type="text"
              placeholder="Search by location or charger name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              // bg-transparent: removes the input's own background so it matches the white box
              className="flex-1 bg-transparent outline-none text-[0.875rem] placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative p-2.5 rounded-xl border shadow-lg transition-colors ${
              showFilters
                ? "bg-primary text-white border-primary" // Highlight if filters are open
                : "bg-white text-muted-foreground border-border"
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && !showFilters && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[0.5rem] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── FILTERS PANEL ─── */}
      {/* Only renders if 'showFilters' is true */}
      {showFilters && (
        <div className="mx-4 mt-3 p-4 bg-white rounded-xl border border-border shadow-sm">
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
              className="text-[0.8125rem] text-primary"
            >
              Reset all
            </button>
          </div>

          {/* Sort Options List */}
          <div className="mb-3">
            <label className="text-[0.75rem] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
              Sort By
            </label>
            <div className="flex flex-wrap gap-1.5">
              {sortOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  // bg-primary vs bg-muted: changes color based on selection
                  className={`px-3 py-1.5 rounded-lg text-[0.75rem] transition-colors ${
                    sortBy === opt
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="text-[0.75rem] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
              Connector Type
            </label>
            <div className="flex flex-wrap gap-1.5">
              {connectorTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedConnector(type)}
                  className={`px-3 py-1.5 rounded-lg text-[0.75rem] transition-colors ${
                    selectedConnector === type
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pt-3 pb-3 border-b border-border -mx-4">
            <p className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Power Output
            </p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "All", sub: "Any" },
                { label: "Level 1", sub: "≤2 kW" },
                { label: "Level 2", sub: "3–22 kW" },
                { label: "DC Fast", sub: "22kW+" },
              ].map(({ label, sub }) => (
                <button
                  key={label}
                  onClick={() => setPowerLevel(label)}
                  className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all duration-150 min-w-[4rem] ${
                    powerLevel === label
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-muted/50 text-foreground border-border"
                  }`}
                >
                  <span className="text-[0.8125rem] font-medium leading-tight">{label}</span>
                  <span
                    className={`text-[0.625rem] mt-0.5 ${
                      powerLevel === label ? "text-white/80" : "text-muted-foreground"
                    }`}
                  >
                    {sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pt-3 pb-3 border-b border-border -mx-4">
            <p className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Minimum Rating
            </p>
            <div className="flex gap-2">
              {["All", "3+", "4+", "4.5+"].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-[0.8125rem] font-medium transition-all duration-150 ${
                    minRating === r
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-muted/50 text-foreground border-border"
                  }`}
                >
                  {r !== "All" && (
                    <Star
                      className={`w-3 h-3 ${
                        minRating === r ? "text-white fill-white" : "text-amber-400 fill-amber-400"
                      }`}
                    />
                  )}
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pt-3 pb-3 border-b border-border -mx-4">
            <p className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Price Range
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "All", sub: "Any price" },
                { label: "Budget", sub: "Up to ₹80/hr" },
                { label: "Mid", sub: "₹80–120/hr" },
                { label: "Premium", sub: "₹120+/hr" },
              ].map(({ label, sub }) => (
                <button
                  key={label}
                  onClick={() => setPriceRange(label)}
                  className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all duration-150 ${
                    priceRange === label
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-muted/50 text-foreground border-border"
                  }`}
                >
                  <span className="text-[0.8125rem] font-medium">{label}</span>
                  <span
                    className={`text-[0.625rem] mt-0.5 ${
                      priceRange === label ? "text-white/80" : "text-muted-foreground"
                    }`}
                  >
                    {sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.875rem] font-medium text-foreground">Available now only</p>
                <p className="text-[0.75rem] text-muted-foreground mt-0.5">Hide chargers that are currently busy</p>
              </div>
              <button
                onClick={() => setOnlyAvailable(!onlyAvailable)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                  onlyAvailable ? "bg-primary" : "bg-switch-background"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    onlyAvailable ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className="border-t border-border mt-3 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.875rem] font-medium text-foreground">Verified hosts only</p>
                  <p className="text-[0.75rem] text-muted-foreground mt-0.5">
                    Show chargers from identity-verified hosts
                  </p>
                </div>
                <button
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                    verifiedOnly ? "bg-primary" : "bg-switch-background"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      verifiedOnly ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── QUICK STATS ─── */}
      {/* A horizontal scrolling row of stats about the network */}
      <div className="flex gap-3 px-4 mt-4 overflow-x-auto no-scrollbar">
        {[
          { icon: Bolt, label: "Chargers", value: chargers.length.toString(), color: "bg-emerald-50 text-emerald-600" },
          { icon: MapPin, label: "Locations", value: "Bangalore", color: "bg-blue-50 text-blue-600" },
          { icon: DollarSign, label: "From", value: "₹80/hr", color: "bg-amber-50 text-amber-600" },
          { icon: Star, label: "Avg Rating", value: "4.7", color: "bg-purple-50 text-purple-600" },
        ].map((stat) => (
          <div
            key={stat.label}
            // flex-shrink-0: keeps these boxes from getting squashed when they scroll horizontally
            className="flex items-center gap-2.5 px-3 py-2.5 bg-white rounded-xl border border-border flex-shrink-0"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[0.6875rem] text-muted-foreground">{stat.label}</p>
              <p className="text-[0.8125rem]" style={{ fontWeight: 600 }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── MAP CTA ─── */}
      {/* Big gradient button to go to the Map screen */}
      <button
        onClick={() => navigate("/map")}
        // bg-gradient-to-r: creates a smooth color fade from left to right
        className="mx-4 mt-4 w-[calc(100%-2rem)] flex items-center justify-between p-3 bg-gradient-to-r from-primary to-emerald-600 rounded-xl text-white shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-[0.875rem]" style={{ fontWeight: 600 }}>Explore on Map</p>
            <p className="text-[0.75rem] text-white/80">Find chargers near you</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* ─── CHARGER LISTINGS ─── */}
      <div className="px-4 mt-6">
        <h2 className="text-[1.125rem] mb-3 font-bold">
          Nearby Chargers
          <span className="text-muted-foreground text-[0.8125rem] ml-2 font-normal">
            ({filtered.length})
          </span>
        </h2>

        {/* Empty State: if no chargers match the user's search */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-[0.875rem] font-medium">No chargers found</p>
            <p className="text-slate-400 text-[0.75rem] mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          // Grid of actual results
          <div className="flex flex-col gap-5">
            {filtered.map((charger) => (
              // The 'ChargerCard' is a separate small component that draws the actual card
              <ChargerCard key={charger.id} charger={charger} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}