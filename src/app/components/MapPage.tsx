import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Zap,
  Star,
  X,
  Shield,
  Navigation,
  LocateFixed,
  Loader2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { Charger } from "../data/mock-data";

// Map center for Bangalore (using OpenStreetMap with Leaflet)
const MAP_CENTER: [number, number] = [12.96, 77.63];

// Distance Calculation Helpers
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
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

function minDistanceFromChargerToRoute(charger: Charger, routeCoords: [number, number][]) {
  let minDistance = Infinity;
  for (const coord of routeCoords) {
    // routeCoords from GeoJSON are [lng, lat]
    const dist = getDistance(charger.lat, charger.lng, coord[1], coord[0]);
    if (dist < minDistance) minDistance = dist;
  }
  return minDistance;
}

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
        transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
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
  
  // Trip Planner State
  const [isTripPanelOpen, setIsTripPanelOpen] = useState(false);
  const [tripState, setTripState] = useState<{
    origin: string;
    destination: string;
    isLoading: boolean;
    routeData: any | null;
    error: string | null;
  }>({
    origin: "",
    destination: "",
    isLoading: false,
    routeData: null,
    error: null,
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  
  // Use a Map to cache markers for performance optimization
  const markersCacheRef = useRef<Map<string, L.Marker>>(new Map());
  const routeLayerRef = useRef<L.GeoJSON | null>(null);

  const filtered = chargers.filter((c) => {
    const matchConnector =
      filterConnector === "All" || c.connectorType === filterConnector;
    const matchAvailable = !showOnlyAvailable || c.available;
    
    // Proximity logic for route
    let matchRoute = true;
    if (tripState.routeData && tripState.routeData.coordinates) {
      const dist = minDistanceFromChargerToRoute(c, tripState.routeData.coordinates);
      matchRoute = dist <= 5; // Chargers within 5km of driving path
    }

    return matchConnector && matchAvailable && matchRoute;
  });

  // Calculate the driving trip
  const calculateTrip = async () => {
    if (!tripState.destination) return;
    setTripState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      let originCoords: [number, number]; 

      // Resolve Origin (GPS or Text)
      if (tripState.origin.toLowerCase() === "my location" || tripState.origin.trim() === "") {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          originCoords = [pos.coords.longitude, pos.coords.latitude];
          setTripState(s => ({ ...s, origin: "My Location" }));
          
          // Move user marker
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([pos.coords.latitude, pos.coords.longitude]);
          }
        } catch (e) {
          throw new Error("Could not get GPS location. Please allow location access or type an address.");
        }
      } else {
        const oRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            tripState.origin + ", India"
          )}&limit=1`
        );
        const oData = await oRes.json();
        if (!oData.length) throw new Error("Could not find origin address");
        originCoords = [parseFloat(oData[0].lon), parseFloat(oData[0].lat)];
      }

      // Resolve Destination
      const dRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          tripState.destination + ", India"
        )}&limit=1`
      );
      const dData = await dRes.json();
      if (!dData.length) throw new Error("Could not find destination address");
      const destCoords = [parseFloat(dData[0].lon), parseFloat(dData[0].lat)];

      // Fetch Driving Route from open source router (OSRM)
      const routeRes = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?overview=full&geometries=geojson`
      );
      const routeData = await routeRes.json();

      if (routeData.code !== "Ok" || !routeData.routes.length) {
        throw new Error("Could not find a driving route between these locations");
      }

      const geojsonData = routeData.routes[0].geometry;

      setTripState((s) => ({ ...s, routeData: geojsonData, isLoading: false }));
      setIsTripPanelOpen(false); // Map auto-zooms below, close panel to see
    } catch (err: any) {
      setTripState((s) => ({
        ...s,
        isLoading: false,
        error: err.message || "Failed to calculate trip.",
      }));
    }
  };

  const getGPSLocation = async () => {
      setTripState(s => ({...s, origin: "Locating..."}));
      try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
          });
          setTripState(s => ({...s, origin: "My Location"}));
          if (userMarkerRef.current && mapInstanceRef.current) {
               userMarkerRef.current.setLatLng([pos.coords.latitude, pos.coords.longitude]);
               mapInstanceRef.current.setView([pos.coords.latitude, pos.coords.longitude], 14, { animate: true });
          }
      } catch (e) {
          setTripState(s => ({...s, origin: "", error: "Location permission denied"}));
      }
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: MAP_CENTER,
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    userMarkerRef.current = L.marker(MAP_CENTER, { icon: userLocationIcon }).addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update trip polyline rendering
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (tripState.routeData) {
      routeLayerRef.current = L.geoJSON(tripState.routeData, {
        style: {
          color: "#2563eb",
          weight: 5,
          opacity: 0.8,
        },
      }).addTo(map);

      map.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
    } else {
      map.setView(MAP_CENTER, 13);
    }
  }, [tripState.routeData]);

  // Optimized Marker rendering (adds/removes selectively without full unmounts)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Remove old markers that don't pass filter
    const activeIds = new Set(filtered.map(c => c.id));
    for (const [id, marker] of markersCacheRef.current.entries()) {
      if (!activeIds.has(id)) {
        marker.remove();
        markersCacheRef.current.delete(id);
      }
    }

    // Add new or update existing
    filtered.forEach((charger) => {
      const isSelected = selectedCharger?.id === charger.id;
      const newIcon = createChargerIcon(charger.pricePerHour, charger.available, isSelected);

      if (markersCacheRef.current.has(charger.id)) {
        markersCacheRef.current.get(charger.id)!.setIcon(newIcon);
      } else {
        const marker = L.marker([charger.lat, charger.lng], { icon: newIcon }).addTo(map);
        marker.on("click", () => {
          setSelectedCharger((prev) => (prev?.id === charger.id ? null : charger));
        });
        markersCacheRef.current.set(charger.id, marker);
      }
    });
  }, [filtered, selectedCharger]);

  return (
    <div className="relative h-full flex flex-col">
      {/* Top Filter and Trip Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col gap-2 pointer-events-none">
        
        {/* Scrollable Pills */}
        <div className="flex gap-2 py-1 overflow-x-auto no-scrollbar pointer-events-auto items-center">
          <button
            onClick={() => setIsTripPanelOpen(!isTripPanelOpen)}
            className={`px-3 py-1.5 rounded-full text-[0.75rem] whitespace-nowrap shadow-md transition-colors flex items-center gap-1.5 font-medium border ${
              isTripPanelOpen || tripState.routeData
                ? "bg-blue-600 text-white border-blue-700" 
                : "bg-white text-foreground border-border hover:bg-muted"
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Trip
          </button>
          
          <div className="w-px h-5 bg-border mx-0.5" />

          {["All", "J1772", "CCS", "Tesla"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterConnector(type === "Tesla" ? "Tesla Wall Connector" : type)}
              className={`px-3 py-1.5 rounded-full text-[0.75rem] whitespace-nowrap shadow-md transition-colors font-medium border ${
                filterConnector === type ||
                (type === "Tesla" && filterConnector === "Tesla Wall Connector")
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-foreground border-border"
              }`}
            >
              {type}
            </button>
          ))}
          <button
            onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
            className={`px-3 py-1.5 rounded-full text-[0.75rem] whitespace-nowrap shadow-md transition-colors font-medium border ${
              showOnlyAvailable
                ? "bg-emerald-500 text-white border-emerald-600"
                : "bg-white text-foreground border-border"
            }`}
          >
            Available Now
          </button>
        </div>

        {/* Trip Planner Drawer */}
        {isTripPanelOpen && (
          <div className="bg-white p-3.5 rounded-2xl shadow-xl border border-border flex flex-col gap-2 w-full max-w-sm mt-1 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between mb-1">
               <h3 className="font-semibold text-[0.875rem] flex items-center gap-1.5">
                   <Navigation className="w-4 h-4 text-blue-600"/> Plan your trip
               </h3>
               <button 
                 onClick={() => setIsTripPanelOpen(false)} 
                 className="p-1 text-muted-foreground hover:bg-muted rounded-md"
               >
                 <X className="w-4 h-4" />
               </button>
            </div>
            
            <div className="relative flex flex-col gap-2.5">
              <div className="absolute left-[1.05rem] top-4 bottom-4 w-0.5 bg-border -z-10 rounded"></div>
              
              <div className="flex items-center gap-2.5 z-10 w-full relative">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full ml-1 ring-4 ring-white shadow-sm flex-shrink-0"></div>
                <input 
                  type="text" 
                  placeholder="Origin" 
                  value={tripState.origin}
                  onChange={(e) => setTripState(s => ({...s, origin: e.target.value}))}
                  className="flex-1 text-[0.8125rem] px-3.5 py-2.5 bg-muted/60 rounded-xl border border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-muted-foreground w-full min-w-0"
                />
                <button 
                  onClick={getGPSLocation}
                  disabled={tripState.origin === "My Location" || tripState.origin === "Locating..."}
                  title="Use Current Location"
                  className="absolute right-1 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 disabled:opacity-50"
                >
                  <LocateFixed className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2.5 z-10 w-full relative">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full ml-1 ring-4 ring-white shadow-sm flex-shrink-0"></div>
                <input 
                  type="text" 
                  placeholder="Destination (e.g. Mysore)" 
                  value={tripState.destination}
                  onChange={(e) => setTripState(s => ({...s, destination: e.target.value}))}
                  className="flex-1 text-[0.8125rem] px-3.5 py-2.5 bg-muted/60 rounded-xl border border-transparent focus:border-red-500 focus:bg-white outline-none transition-all placeholder:text-muted-foreground w-full min-w-0"
                />
              </div>
            </div>
            
            {tripState.error && (
                <p className="text-red-500 text-[0.75rem] px-1 animate-in fade-in">{tripState.error}</p>
            )}
            
            <div className="flex gap-2 mt-2">
              <button 
                onClick={calculateTrip}
                disabled={tripState.isLoading || !tripState.destination}
                className="flex-1 bg-blue-600 text-white font-medium py-2.5 rounded-xl text-[0.875rem] hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {tripState.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {tripState.isLoading ? "Calculating..." : "Find Route & Chargers"}
              </button>
              {tripState.routeData && (
                <button 
                  onClick={() => setTripState(s => ({ ...s, routeData: null, destination: "", origin: "" }))}
                  className="px-4 bg-white text-muted-foreground font-medium py-2.5 rounded-xl text-[0.875rem] hover:bg-muted transition-colors border border-border"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="flex-1 relative z-0" />

      {/* Selected Charger Detail Card */}
      {selectedCharger && (
        <div className="absolute bottom-4 left-3 right-3 z-[1000] animate-in slide-in-from-bottom-5">
          <div className="bg-white rounded-2xl shadow-xl border border-border overflow-hidden">
            <button
              onClick={() => setSelectedCharger(null)}
              className="absolute top-2 right-2 z-10 w-7 h-7 bg-black/30 hover:bg-black/50 transition-colors rounded-full flex items-center justify-center backdrop-blur-sm"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            <div className="flex gap-3 p-3">
              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-sm relative">
                <ImageWithFallback
                  src={selectedCharger.image}
                  alt={selectedCharger.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-[0.9375rem] truncate text-foreground" style={{ fontWeight: 600 }}>
                      {selectedCharger.title}
                    </h3>
                    {selectedCharger.verified && (
                      <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="text-[0.75rem] text-muted-foreground truncate mt-0.5">
                    {selectedCharger.address}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <div className="flex items-center gap-0.5 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[0.6875rem] font-medium">
                      <Star className="w-3 h-3 fill-amber-500" />
                      {selectedCharger.rating}
                    </div>
                    <span className="text-[0.6875rem] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                      {selectedCharger.connectorType}
                    </span>
                    <span className="text-[0.6875rem] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium flex items-center gap-0.5">
                      <Zap className="w-3 h-3" />
                      {selectedCharger.power} kW
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <span className="text-[1.125rem] text-primary block leading-none" style={{ fontWeight: 700 }}>
                    ₹{selectedCharger.pricePerHour}
                    <span className="text-[0.75rem] text-muted-foreground ml-0.5" style={{ fontWeight: 500 }}>/hr</span>
                  </span>
                  <button
                    onClick={() => navigate(`/charger/${selectedCharger.id}`)}
                    className="px-4 py-1.5 bg-primary text-white rounded-lg text-[0.8125rem] font-medium hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Floating Info Pill */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[999] pointer-events-none transition-transform duration-300">
        {!selectedCharger && (
          <div className="bg-foreground text-background shadow-xl rounded-full px-4 py-2 border border-border/10 flex items-center gap-2">
            <span className="text-[0.8125rem] font-medium leading-none">
              <span className="text-white font-bold">{filtered.length}</span> chargers {tripState.routeData ? 'on route' : 'nearby'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}