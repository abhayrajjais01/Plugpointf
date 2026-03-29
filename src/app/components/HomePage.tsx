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

const connectorTypes = ["All", "J1772", "CCS", "Tesla Wall Connector"];
const sortOptions = ["Nearest", "Price: Low", "Price: High", "Top Rated"];

export function HomePage() {
  const { chargers } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConnector, setSelectedConnector] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("Nearest");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const filtered = chargers
    .filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesConnector =
        selectedConnector === "All" || c.connectorType === selectedConnector;
      const matchesAvailable = !onlyAvailable || c.available;
      return matchesSearch && matchesConnector && matchesAvailable;
    })
    .sort((a, b) => {
      if (sortBy === "Price: Low") return a.pricePerHour - b.pricePerHour;
      if (sortBy === "Price: High") return b.pricePerHour - a.pricePerHour;
      if (sortBy === "Top Rated") return b.rating - a.rating;
      return 0;
    });

  const availableCount = chargers.filter((c) => c.available).length;

  return (
    <div className="pb-4">
      {/* Hero Section */}
      <div className="relative h-52 overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1765272088009-100c96a4cd4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMHN0YXRpb24lMjBtb2Rlcm58ZW58MXx8fHwxNzcxMzcwNTA2fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="EV Charging"
          className="w-full h-full object-cover"
        />
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

      {/* Search Bar */}
      <div className="px-4 -mt-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white rounded-xl border border-border shadow-lg px-3 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <input
              type="text"
              placeholder="Search by location or charger name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[0.875rem] placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border shadow-lg transition-colors ${
              showFilters
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted-foreground border-border"
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mx-4 mt-3 p-4 bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[0.9375rem]" style={{ fontWeight: 600 }}>Filters</h3>
            <button
              onClick={() => {
                setSelectedConnector("All");
                setSortBy("Nearest");
                setOnlyAvailable(false);
              }}
              className="text-[0.8125rem] text-primary"
            >
              Reset
            </button>
          </div>

          <div className="mb-3">
            <label className="text-[0.75rem] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
              Sort By
            </label>
            <div className="flex flex-wrap gap-1.5">
              {sortOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSortBy(opt)}
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

          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-9 h-5 rounded-full transition-colors relative ${
                onlyAvailable ? "bg-primary" : "bg-switch-background"
              }`}
              onClick={() => setOnlyAvailable(!onlyAvailable)}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
                  onlyAvailable ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
            <span className="text-[0.8125rem]">Available now only</span>
          </label>
        </div>
      )}

      {/* Quick Stats */}
      <div className="flex gap-3 px-4 mt-4 overflow-x-auto no-scrollbar">
        {[
          { icon: Bolt, label: "Chargers", value: chargers.length.toString(), color: "bg-emerald-50 text-emerald-600" },
          { icon: MapPin, label: "Locations", value: "Bangalore", color: "bg-blue-50 text-blue-600" },
          { icon: DollarSign, label: "From", value: "₹80/hr", color: "bg-amber-50 text-amber-600" },
          { icon: Star, label: "Avg Rating", value: "4.7", color: "bg-purple-50 text-purple-600" },
        ].map((stat) => (
          <div
            key={stat.label}
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

      {/* Map CTA */}
      <button
        onClick={() => navigate("/map")}
        className="mx-4 mt-4 flex items-center justify-between p-3 bg-gradient-to-r from-primary to-emerald-600 rounded-xl text-white"
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

      {/* How It Works */}
      <div className="px-4 mt-6">
        <h2 className="text-[1.125rem] mb-3" style={{ fontWeight: 600 }}>How It Works</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Search, step: "1", title: "Find", desc: "Search nearby chargers" },
            { icon: Clock, step: "2", title: "Book", desc: "Reserve your time slot" },
            { icon: Zap, step: "3", title: "Charge", desc: "Plug in and power up" },
          ].map((item) => (
            <div
              key={item.step}
              className="flex flex-col items-center text-center p-3 bg-white rounded-xl border border-border"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-[0.8125rem]" style={{ fontWeight: 600 }}>{item.title}</p>
              <p className="text-[0.6875rem] text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <Shield className="w-8 h-8 text-primary flex-shrink-0" />
          <div>
            <p className="text-[0.8125rem]" style={{ fontWeight: 600 }}>Verified & Trusted</p>
            <p className="text-[0.75rem] text-muted-foreground">
              All hosts are identity-verified. Every charger is inspected for safety.
            </p>
          </div>
        </div>
      </div>

      {/* Charger Listings */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[1.125rem]" style={{ fontWeight: 600 }}>
            Nearby Chargers
            <span className="text-muted-foreground text-[0.8125rem] ml-2" style={{ fontWeight: 400 }}>
              ({filtered.length})
            </span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-[0.875rem]">No chargers found</p>
            <p className="text-muted-foreground text-[0.75rem] mt-1">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {filtered.map((charger) => (
              <ChargerCard key={charger.id} charger={charger} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}