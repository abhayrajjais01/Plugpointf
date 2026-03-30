import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Zap,
  Star,
  X,
  Shield,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { Charger } from "../data/mock-data";

// Map center for Bangalore (using OpenStreetMap with Leaflet)
const MAP_CENTER: [number, number] = [12.96, 77.63];

// Custom marker icon for chargers
const createChargerIcon = (
  pricePerHour: number,
  isAvailable: boolean,
  isSelected: boolean
) => {
  const color = isSelected ? "#10B981" : isAvailable ? "#ffffff" : "#d1d5db";
  const textColor = isSelected ? "#ffffff" : isAvailable ? "#000000" : "#6b7280";
  const borderColor = isSelected ? "#10B981" : "#e5e7eb";

  return L.divIcon({
    className: "custom-charger-marker",
    html: `
      <div style="
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 9999px;
        background-color: ${color};
        color: ${textColor};
        border: 1px solid ${borderColor};
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        transform: ${isSelected ? 'scale(1.3)' : 'scale(1)'};
        transition: all 0.2s;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span>₹${pricePerHour}</span>
      </div>
      <div style="
        width: 8px;
        height: 8px;
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
        background-color: ${color};
        border-right: 1px solid ${borderColor};
        border-bottom: 1px solid ${borderColor};
      "></div>
    `,
    iconSize: [60, 30],
    iconAnchor: [30, 30],
  });
};

// User location marker
const userLocationIcon = L.divIcon({
  className: "user-location-marker",
  html: `
    <div style="position: relative;">
      <div style="
        width: 16px;
        height: 16px;
        background-color: #3b82f6;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      "></div>
      <div style="
        position: absolute;
        inset: 0;
        width: 16px;
        height: 16px;
        background-color: rgba(59, 130, 246, 0.3);
        border-radius: 50%;
        animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
    </div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export function MapPage() {
  const { chargers } = useApp();
  const navigate = useNavigate();
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);
  const [filterConnector, setFilterConnector] = useState("All");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const evModels = [
    { label: "All", connector: "All" },
    { label: "Tata Nexon", connector: "CCS" },
    { label: "MG ZS EV", connector: "CCS" },
    { label: "Ather 450", connector: "J1772" },
  ];

  const filtered = chargers.filter((c) => {
    const selectedModel = evModels.find((m) => m.label === filterConnector);
    const matchConnector =
      filterConnector === "All" || c.connectorType === selectedModel?.connector;
    const matchAvailable = !showOnlyAvailable || c.available;
    return matchConnector && matchAvailable;
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: MAP_CENTER,
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add user location marker
    L.marker(MAP_CENTER, { icon: userLocationIcon }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when filtered chargers change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    filtered.forEach((charger) => {
      const isSelected = selectedCharger?.id === charger.id;
      const marker = L.marker([charger.lat, charger.lng], {
        icon: createChargerIcon(
          charger.pricePerHour,
          charger.available,
          isSelected
        ),
      }).addTo(mapInstanceRef.current!);

      marker.on("click", () => {
        setSelectedCharger(charger);
      });

      markersRef.current.push(marker);
    });
  }, [filtered, selectedCharger]);

  return (
    <div className="relative h-full flex flex-col">
      {/* Filter Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex gap-2 overflow-x-auto no-scrollbar">
        {evModels.map((model) => (
          <button
            key={model.label}
            onClick={() => setFilterConnector(model.label)}
            className={`px-3 py-1.5 rounded-full text-[0.75rem] whitespace-nowrap shadow-md transition-colors flex-shrink-0 font-medium ${
              filterConnector === model.label
                ? "bg-primary text-white"
                : "bg-white text-foreground border border-border"
            }`}
          >
            {model.label}
          </button>
        ))}
        <button
          onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
          className={`px-3 py-1.5 rounded-full text-[0.75rem] whitespace-nowrap shadow-md transition-colors flex-shrink-0 font-medium ${
            showOnlyAvailable
              ? "bg-emerald-500 text-white"
              : "bg-white text-foreground border border-border"
          }`}
        >
          Available Now
        </button>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="flex-1 relative" />

      {/* Selected Charger Card */}
      {selectedCharger && (
        <div className="absolute bottom-4 left-3 right-3 z-[1000]">
          <div className="bg-white rounded-xl shadow-xl border border-border overflow-hidden">
            <button
              onClick={() => setSelectedCharger(null)}
              className="absolute top-2 right-2 z-10 w-6 h-6 bg-black/40 rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
            <div className="flex gap-3 p-3">
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <ImageWithFallback
                  src={selectedCharger.image}
                  alt={selectedCharger.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="text-[0.875rem] truncate" style={{ fontWeight: 600 }}>
                    {selectedCharger.title}
                  </h3>
                  {selectedCharger.verified && (
                    <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  )}
                </div>
                <p className="text-[0.75rem] text-muted-foreground truncate mt-0.5">
                  {selectedCharger.address}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-[0.75rem]" style={{ fontWeight: 500 }}>
                      {selectedCharger.rating}
                    </span>
                  </div>
                  <span className="text-[0.6875rem] text-muted-foreground">
                    {selectedCharger.connectorType}
                  </span>
                  <span className="text-[0.6875rem] text-muted-foreground">
                    {selectedCharger.power} kW
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[0.9375rem] text-primary" style={{ fontWeight: 700 }}>
                    ₹{selectedCharger.pricePerHour}/hr
                  </span>
                  <button
                    onClick={() => navigate(`/charger/${selectedCharger.id}`)}
                    className="px-3 py-1 bg-primary text-white rounded-lg text-[0.75rem]"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charger count */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[999]">
        {!selectedCharger && (
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-md border border-border">
            <span className="text-[0.75rem] text-muted-foreground flex items-center gap-1.5">
              <span className="font-semibold text-foreground">{filtered.length}</span>
              chargers
              {filterConnector !== "All" && (
                <span className="text-primary font-medium">· {filterConnector}</span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}