import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Zap,
  Star,
  X,
  Shield,
  Navigation,
  LocateFixed,
  Loader2,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Gift,
  List,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  BatteryCharging,
  Users,
  Globe,
  Share2,
  User
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ChargerCard } from "./ChargerCard";
import type { Charger } from "../data/mock-data";
import { encodePolyline } from "../../lib/polyline";

// --- MAP SETTINGS ---
// This is the starting point for our map (Bangalore city coordinates)
const MAP_CENTER: [number, number] = [77.63, 12.96]; // [longitude, latitude]

// We use "MapLibre" to show the map, but we want it to look like Google Maps.
// This configuration tells MapLibre to pull "tiles" (images of the world) from Google's servers.
const GOOGLE_MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'google-roadmap': {
      type: 'raster',
      tiles: ['https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'],
      tileSize: 256,
      attribution: 'Map data &copy; <a href="https://www.google.com/maps">Google</a>'
    }
  },
  layers: [
    {
      id: 'google-layer',
      type: 'raster',
      source: 'google-roadmap',
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

// --- MATH HELPERS ---
// This math formula (Haversine) calculates the real-world distance between two GPS points in kilometers.
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // The Earth's radius is roughly 6371 km
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

// This checks how far a charger is from a driving route. 
// It looks at every point on the route line and finds the closest one.
function minDistanceFromChargerToRoute(charger: Charger, routeCoords: [number, number][]) {
  let minDistance = Infinity;
  for (const coord of routeCoords) {
    // coord[0] is longitude, coord[1] is latitude
    const dist = getDistance(charger.lat, charger.lng, coord[1], coord[0]);
    if (dist < minDistance) minDistance = dist;
  }
  return minDistance;
}

export function MapPage() {
  const { chargers, fetchPublicChargers, fetchPublicChargersForRoute, user, tripState, setTripState, isNavigating, setIsNavigating } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get("tab");

  // --- STATE MANAGEMENT ---
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);
  const [filterConnector, setFilterConnector] = useState("All");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showFastOnly, setShowFastOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<"map" | "trip" | "social">(tabParam === "trip" ? "trip" : "map");
  const [showFilters, setShowFilters] = useState(false);
  const [showListView, setShowListView] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // --- REFS ---
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const hasInitializedNearest = useRef(false);
  const lastFetchedLocation = useRef<{ lat: number; lng: number } | null>(null);
  const cardScrollRef = useRef<HTMLDivElement>(null);

  // Filter logic
  const filtered = chargers.filter((c) => {
    const matchConnector =
      filterConnector === "All" || c.connectorType === filterConnector;
    const matchAvailable = !showOnlyAvailable || c.available;
    const matchFast = !showFastOnly || c.power >= 22;
    const matchSearch = !searchQuery || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchRoute = true;
    if (tripState.routeData && tripState.routeData.coordinates) {
      const dist = minDistanceFromChargerToRoute(c, tripState.routeData.coordinates);
      matchRoute = dist <= 5;
    }

    return matchConnector && matchAvailable && matchFast && matchRoute && matchSearch;
  }).sort((a, b) => {
    // Sort by nearest distance if user location is known
    if (userLocation) {
      const distA = getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
      const distB = getDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
      return distA - distB;
    }
    return 0; // Maintain original order if no location
  });

  // Calculate distance from user location
  const getChargerDistance = (charger: Charger) => {
    if (!userLocation) return null;
    return getDistance(userLocation.lat, userLocation.lng, charger.lat, charger.lng);
  };

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
          
          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([pos.coords.longitude, pos.coords.latitude]);
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

      // Fetch Driving Route from OSRM
      const routeRes = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?overview=full&geometries=geojson`
      );
      const routeData = await routeRes.json();

      if (routeData.code !== "Ok" || !routeData.routes.length) {
        throw new Error("Could not find a driving route between these locations");
      }

      const geojsonData = routeData.routes[0].geometry;
      setTripState((s) => ({ ...s, routeData: geojsonData, isLoading: false }));
      setActiveNavTab("map"); // Switch back to map to show the route

      // Fetch all public OCM chargers located along this driving polyline
      const polylineStr = encodePolyline(geojsonData.coordinates);
      fetchPublicChargersForRoute(polylineStr);
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
          if (userMarkerRef.current && mapRef.current) {
               userMarkerRef.current.setLngLat([pos.coords.longitude, pos.coords.latitude]);
               mapRef.current.flyTo({
                 center: [pos.coords.longitude, pos.coords.latitude],
                 zoom: 14,
               });
          }
      } catch (e) {
          setTripState(s => ({...s, origin: "", error: "Location permission denied"}));
      }
  };

  const centerOnUser = () => {
    if (mapRef.current && userMarkerRef.current) {
      const lngLat = userMarkerRef.current.getLngLat();
      mapRef.current.flyTo({ center: lngLat, zoom: 15, duration: 800 });
    }
  };

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: GOOGLE_MAP_STYLE,
      center: MAP_CENTER,
      zoom: 13,
    });

    map.on('load', () => {
      // User Marker
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.innerHTML = `
        <div style="position: relative;">
          <div style="width: 16px; height: 16px; background-color: #3b82f6; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>
          <div style="position: absolute; inset: 0; width: 16px; height: 16px; background-color: rgba(59, 130, 246, 0.3); border-radius: 50%; animation: ping 2s infinite;"></div>
        </div>
      `;
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(MAP_CENTER)
        .addTo(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Set and track live location and find nearest charger
  useEffect(() => {
    let watchId: number;

    if (navigator.geolocation) {
      // First get current position to center map and find charger
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { longitude, latitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([longitude, latitude]);
          }

          if (mapRef.current && !lastFetchedLocation.current) {
            mapRef.current.flyTo({
              center: [longitude, latitude],
              zoom: 14
            });
          }

          // Fetch public chargers nearby only if location changed significantly (>500m) or it's the first time
          const distanceMoved = lastFetchedLocation.current 
            ? getDistance(latitude, longitude, lastFetchedLocation.current.lat, lastFetchedLocation.current.lng)
            : Infinity;

          if (distanceMoved > 0.5) {
             fetchPublicChargers(latitude, longitude);
             lastFetchedLocation.current = { lat: latitude, lng: longitude };
          }

          // Only auto-select the nearest charger ONCE upon initial load
          if (chargers.length > 0 && !hasInitializedNearest.current && !selectedCharger) {
            let nearest = chargers[0];
            let minDist = getDistance(latitude, longitude, nearest.lat, nearest.lng);
            
            for (let i = 1; i < chargers.length; i++) {
              const dist = getDistance(latitude, longitude, chargers[i].lat, chargers[i].lng);
              if (dist < minDist) {
                minDist = dist;
                nearest = chargers[i];
              }
            }
            
            setSelectedCharger(nearest);
            hasInitializedNearest.current = true;
          }
        },
        (err) => console.error("Initial location error:", err),
        { timeout: 10000 }
      );

      // Then watch position for live updates
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { longitude, latitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([longitude, latitude]);
          }
          if (isNavigating && mapRef.current) {
            mapRef.current.flyTo({ center: [longitude, latitude], zoom: 16 });
          }
        },
        (err) => console.error("Watch location error:", err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    return () => {
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [chargers.length, isNavigating]); // Use chargers.length instead of chargers array to avoid ref issues triggering constantly

  // Update trip link param
  useEffect(() => {
    if (tabParam === "trip") {
      setActiveNavTab("trip");
      // Remove query param without reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [tabParam]);

  // Route Rendering
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    const map = mapRef.current;

    if (map.getLayer('route')) map.removeLayer('route');
    if (map.getSource('route')) map.removeSource('route');

    if (tripState.routeData) {
      map.addSource('route', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': tripState.routeData
        }
      });
      map.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': '#2563eb',
          'line-width': 6,
          'line-opacity': 0.8
        }
      });

      // Fit bounds
      const coords = tripState.routeData.coordinates;
      const bounds = coords.reduce((acc: maplibregl.LngLatBounds, coord: [number, number]) => {
        return acc.extend(coord);
      }, new maplibregl.LngLatBounds(coords[0], coords[0]));
      
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [tripState.routeData]);

  // Marker Management
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove old markers
    const activeIds = new Set(filtered.map(c => c.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!activeIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add/Update markers
    filtered.forEach(charger => {
      const isSelected = selectedCharger?.id === charger.id;
      // Active/Available color matching the orange pins in image
      const pinFill = isSelected ? "#059669" : charger.available ? "#ea580c" : "#9ca3af";
      const pinStroke = isSelected ? "#047857" : charger.available ? "#c2410c" : "#6b7280";
      const scale = isSelected ? 'scale(1.15)' : 'scale(1)';

      if (markersRef.current[charger.id]) {
        const el = markersRef.current[charger.id].getElement();
        
        // Update SVG fills and transform using the inner div
        const inner = el.querySelector('.marker-inner') as HTMLDivElement;
        const svgBg = el.querySelector('.marker-bg') as SVGElement;
        
        if (svgBg) {
          svgBg.setAttribute('fill', pinFill);
          svgBg.setAttribute('stroke', pinStroke);
        }
        if (inner) {
          inner.style.transform = scale;
        }
      } else {
        const el = document.createElement('div');
        el.className = 'custom-marker';
        // MapLibre uses CSS translate for positioning, so we style the size but leave transform free
        el.style.cssText = `
          width: 24px; height: 30px; cursor: pointer;
        `;
        
        // Add an inner div that we can safely transform for hover/selection scaling without conflicting with MapLibre
        el.innerHTML = `
        <div class="marker-inner" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: bottom center; transform: ${scale}">
          <svg class="marker-bg" viewBox="0 0 24 24" fill="${pinFill}" stroke="${pinStroke}" stroke-width="1.5" style="width: 28px; height: 28px; position: absolute; bottom: 0; left: -2px; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3)); z-index: 0; transition: fill 0.2s, stroke 0.2s;">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="position: relative; z-index: 1; margin-bottom: 5px;">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        </div>
        `;
        
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedCharger(prev => prev?.id === charger.id ? null : charger);
        });

        markersRef.current[charger.id] = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([charger.lng, charger.lat])
          .addTo(map);
      }
    });
  }, [filtered, selectedCharger]);

  // Scroll to selected card
  useEffect(() => {
    if (selectedCharger && cardScrollRef.current) {
      const idx = filtered.findIndex(c => c.id === selectedCharger.id);
      if (idx >= 0) {
        const card = cardScrollRef.current.children[idx] as HTMLElement;
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    }
  }, [selectedCharger]);

  return (
    <div className="relative h-full flex flex-col overflow-hidden bg-slate-50" style={{ marginTop: '-1px' }}>
      
      {/* === DARK HEADER SECTION (Statiq-style) === */}
      <div className="absolute top-0 left-0 right-0 z-30 flex flex-col pointer-events-none pb-6" style={{ background: 'linear-gradient(to bottom, rgba(15, 27, 45, 0.9) 0%, rgba(15, 27, 45, 0.5) 60%, rgba(15, 27, 45, 0) 100%)' }}>
        
        {/* Top Row: Vehicle selector + Rewards + Profile */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 pointer-events-auto">
          {/* Vehicle / EV Selector */}
          <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all active:scale-95">
            <div className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-white text-xs font-semibold tracking-tight">My EV</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/50" />
          </button>

          {/* Right side: Profile Badge */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all shadow-sm"
            >
              <User className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Map/Trip/Social Navbar */}
        <div className="px-4 pb-3 pt-1 pointer-events-auto flex justify-center">
          <div className="bg-white/10 backdrop-blur-md p-1 rounded-full flex items-center gap-1 w-full max-w-md border border-white/20">
            <button 
              onClick={() => setActiveNavTab('map')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition-all ${activeNavTab === 'map' ? 'bg-white text-slate-900 shadow-md' : 'text-white hover:bg-white/10'}`}
            >
              <MapPin className="w-3.5 h-3.5" />
              Map
            </button>
            <button 
              onClick={() => setActiveNavTab('trip')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition-all ${activeNavTab === 'trip' ? 'bg-white text-slate-900 shadow-md' : 'text-white hover:bg-white/10'}`}
            >
              <Navigation className="w-3.5 h-3.5" />
              Trip
            </button>
            <button 
              onClick={() => setActiveNavTab('social')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition-all ${activeNavTab === 'social' ? 'bg-white text-slate-900 shadow-md' : 'text-white hover:bg-white/10'}`}
            >
              <Users className="w-3.5 h-3.5" />
              Social
            </button>
          </div>
        </div>

        {/* Dynamic Content based on Active Tab */}
        {activeNavTab === "map" && (
          <div className="animate-in fade-in slide-in-from-top-2">
            {/* Search Bar */}
            <div className="px-4 pb-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Charger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchPanel(true)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-sm text-slate-800 placeholder-slate-400 outline-none border-none shadow-sm"
                style={{ fontSize: '13px' }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${showFilters ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              <SlidersHorizontal className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Filter Chips Row */}
        {showFilters && (
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto animate-in fade-in slide-in-from-top-2">
            {/* Available Filter */}
            <button
              onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border shadow-sm ${
                showOnlyAvailable 
                  ? "bg-white text-slate-900 border-transparent shadow-md" 
                  : "bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20"
              }`}
            >
              {showOnlyAvailable ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
              )}
              Available
              {showOnlyAvailable && (
                <X className="w-3 h-3 text-slate-500 ml-0.5 hover:text-slate-900" onClick={(e) => { e.stopPropagation(); setShowOnlyAvailable(false); }} />
              )}
            </button>

            {/* Fast Charger Filter */}
            <button
              onClick={() => setShowFastOnly(!showFastOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border shadow-sm ${
                showFastOnly 
                  ? "bg-white text-slate-900 border-transparent shadow-md" 
                  : "bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20"
              }`}
            >
              <Zap className={`w-3 h-3 ${showFastOnly ? 'text-amber-500 fill-amber-500' : 'text-amber-300 fill-amber-300'}`} />
              Fast charger
            </button>

            {/* Offers Filter (decorative for now) */}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border shadow-sm bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20"
            >
              <Gift className="w-3 h-3 text-white/80" />
              Offers
            </button>

            {/* Connector Type Filters */}
            {["All", "CCS", "J1772", "Tesla"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterConnector(type === "Tesla" ? "Tesla Wall Connector" : type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border shadow-sm ${
                  filterConnector === type || (type === "Tesla" && filterConnector === "Tesla Wall Connector")
                    ? "bg-white text-slate-900 border-transparent shadow-md"
                    : "bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20"
                }`}
              >
                {type === "All" ? "All" : type}
              </button>
            ))}
          </div>
        )}
          </div>
        )}
      </div>

      {/* === SOCIAL PANEL CONTENT === */}
      {activeNavTab === "social" && (
        <div className="absolute inset-0 z-20 bg-slate-50 pt-[140px] px-4 overflow-y-auto pb-24">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900">Community Trips</h2>
              <button className="text-blue-600 text-sm font-semibold hover:text-blue-700">Share Trip</button>
            </div>
            
            {[
              { id: 1, user: "Alex M.", route: "Bangalore → Mysore", distance: "145 km", duration: "3h 15m", likes: 24, timeAgo: "2 hours ago", avatar: "AM" },
              { id: 2, user: "Priya S.", route: "Mumbai → Pune", distance: "150 km", duration: "3h", likes: 56, timeAgo: "5 hours ago", avatar: "PS" },
              { id: 3, user: "Rahul T.", route: "Delhi → Chandigarh", distance: "240 km", duration: "4h 30m", likes: 12, timeAgo: "1 day ago", avatar: "RT" },
              { id: 4, user: "Neha K.", route: "Chennai → Pondicherry", distance: "165 km", duration: "3h 45m", likes: 89, timeAgo: "2 days ago", avatar: "NK" }
            ].map(trip => (
              <div key={trip.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                      {trip.avatar}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{trip.user}</h4>
                      <p className="text-[10px] text-slate-500">{trip.timeAgo}</p>
                    </div>
                  </div>
                  <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 text-slate-800">
                  <Navigation className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-bold">{trip.route}</span>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-medium text-slate-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {trip.distance}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {trip.duration}
                  </div>
                </div>
                
                <div className="pt-3 border-t border-slate-100 mt-1 flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-500 transition-colors">
                    <Star className="w-4 h-4" />
                    {trip.likes} Likes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === TRIP PLANNING PANEL (slides under header) === */}
      {activeNavTab === "trip" && (
        <div className="absolute top-[calc(100px+4.5rem)] left-3 right-3 z-40 animate-in fade-in slide-in-from-top-4">
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 flex flex-col gap-3 w-full max-w-sm">
            <div className="flex items-center justify-between">
               <h3 className="font-bold text-[0.875rem] flex items-center gap-2">
                   <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                     <Navigation className="w-4 h-4 text-blue-600"/>
                   </div>
                   Plan your trip
               </h3>
            </div>
            
            <div className="relative flex flex-col gap-2">
              <div className="absolute left-[1.125rem] top-5 bottom-5 w-0.5 bg-slate-100 -z-0"></div>
              
              <div className="flex items-center gap-3 z-10 relative">
                <div className="w-3 h-3 bg-blue-500 rounded-full ml-0.5 ring-4 ring-white shadow-sm"></div>
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Origin" 
                    value={tripState.origin}
                    onChange={(e) => setTripState(s => ({...s, origin: e.target.value}))}
                    className="w-full text-[0.8125rem] px-4 py-2.5 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button onClick={getGPSLocation} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 transition-opacity">
                    <LocateFixed className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 z-10 relative">
                <div className="w-3 h-3 bg-rose-500 rounded-full ml-0.5 ring-4 ring-white shadow-sm"></div>
                <input 
                  type="text" 
                  placeholder="Destination (e.g. Mysore)" 
                  value={tripState.destination}
                  onChange={(e) => setTripState(s => ({...s, destination: e.target.value}))}
                  className="w-full text-[0.8125rem] px-4 py-2.5 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-rose-500 transition-all"
                />
              </div>
            </div>
            
            {tripState.error && <p className="text-red-500 text-[0.75rem] px-1">{tripState.error}</p>}
            
            <div className="flex gap-2 mt-1">
              <button 
                onClick={calculateTrip}
                disabled={tripState.isLoading}
                className="flex-1 bg-black text-white font-semibold py-3 rounded-xl text-[0.875rem] hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {tripState.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Plan Route"}
              </button>
              {tripState.routeData && (
                <button onClick={() => setTripState(s => ({ ...s, routeData: null }))} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- NAVIGATION MODE HEADER --- */}
      {activeNavTab === "map" && isNavigating && (
        <div className="absolute top-[calc(100px+4.5rem)] left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
          <div className="bg-white/95 backdrop-blur shadow-xl rounded-full px-4 py-2 flex items-center gap-3 border border-border">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
            </span>
            <span className="text-[0.875rem] font-bold">Navigating...</span>
            <div className="w-px h-4 bg-border/60 mx-1 border-gray-300"></div>
            <button
               onClick={() => {
                 setIsNavigating(false);
                 setTripState(s => ({...s, routeData: null}));
               }}
               className="text-[0.8125rem] text-red-600 font-bold hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
            >
              End Trip
            </button>
          </div>
        </div>
      )}

      {/* --- START JOURNEY BUTTON --- */}
      {activeNavTab === "map" && tripState.routeData && !isNavigating && (
        <div className="absolute bottom-44 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8 flex gap-2">
          <button 
             onClick={() => {
               setIsNavigating(true);
               if (mapRef.current && userMarkerRef.current) {
                 const location = userMarkerRef.current.getLngLat() || mapRef.current.getCenter();
                 mapRef.current.flyTo({ center: location, zoom: 16, pitch: 45 });
               }
             }}
             className="bg-blue-600 text-white px-8 py-3.5 rounded-full shadow-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-blue-600/20"
          >
            <Navigation className="w-5 h-5 fill-current" />
            Start Journey
          </button>
          
          <button 
            onClick={() => setTripState(s => ({ ...s, routeData: null }))}
            className="bg-white text-slate-400 p-3.5 rounded-full shadow-lg border border-slate-100 hover:text-red-500 transition-colors"
            title="Clear Route"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* === MAP CONTAINER === */}
      <div ref={mapContainerRef} className="flex-1 z-0" />

      {/* === FLOATING ACTION BUTTONS (Right side) === */}
      {activeNavTab === "map" && (
        <div className="absolute right-3 bottom-48 z-20 flex flex-col gap-2.5">
          {/* GPS Center Button */}
          <button
            onClick={centerOnUser}
            className="w-11 h-11 bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-100 hover:bg-slate-50 active:scale-95 transition-all"
            title="Center on my location"
          >
            <LocateFixed className="w-5 h-5 text-slate-700" />
          </button>
          
          {/* List View Toggle */}
          <button
            onClick={() => setShowListView(true)}
            className="w-11 h-11 bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-100 hover:bg-slate-50 active:scale-95 transition-all"
            title="List view"
          >
            <List className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      )}

      {/* === BOTTOM STATION CARDS (Horizontally Scrollable) === */}
      {activeNavTab === "map" && (
        <div className="absolute bottom-2 left-0 right-0 z-20">
        <div 
          ref={cardScrollRef}
          className="flex gap-3 overflow-x-auto no-scrollbar px-3 pb-2 snap-x snap-mandatory"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {filtered.map((charger) => {
            const dist = getChargerDistance(charger);
            const isSelected = selectedCharger?.id === charger.id;
            
            return (
              <div
                key={charger.id}
                onClick={() => {
                  setSelectedCharger(charger);
                  if (mapRef.current) {
                    mapRef.current.flyTo({ center: [charger.lng, charger.lat], zoom: 15, duration: 600 });
                  }
                }}
                className={`flex-shrink-0 snap-center cursor-pointer transition-all duration-300 ${
                  isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
                style={{ width: 'calc(85vw - 24px)', maxWidth: '340px' }}
              >
                <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-colors ${
                  isSelected ? 'border-primary shadow-xl' : 'border-transparent'
                }`}>
                  {/* Card Content */}
                  <div className="p-3.5">
                    <div className="flex items-start gap-3">
                      {/* Station Icon */}
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <BatteryCharging className="w-5 h-5 text-primary" />
                      </div>

                      {/* Station Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-1">{charger.title}</h3>
                          {/* Rating Badge */}
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 flex-shrink-0">
                            <span className="text-xs font-bold text-emerald-700">{charger.rating}</span>
                            <Star className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                          </div>
                        </div>
                        
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{charger.address}</p>
                        
                        {/* Distance */}
                        {dist !== null && (
                          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                            {dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)} km away`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Availability + Connector Types + View */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {/* Availability Badge */}
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          charger.available 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-red-50 text-red-500'
                        }`}>
                          {charger.available ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {charger.available ? 'Available' : 'In Use'}
                        </div>

                        {/* Connector Type Pills */}
                        <div className="flex items-center gap-1">
                          {charger.connectorType.includes("CCS") && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">DC</span>
                          )}
                          {(charger.connectorType.includes("J1772") || charger.connectorType.includes("Tesla")) && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">AC</span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600">{charger.power}kW</span>
                        </div>
                      </div>

                      {/* View Details Arrow */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/charger/${charger.id}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary/90 active:scale-95 transition-all"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* === CHARGER COUNT BADGE (when no cards) === */}
      {activeNavTab === "map" && filtered.length === 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-slate-900/90 backdrop-blur-md text-white shadow-2xl rounded-full px-5 py-2.5 flex items-center gap-3 border border-white/10">
            <span className="text-xs font-bold tracking-tight">
              No chargers match your filters
            </span>
          </div>
        </div>
      )}

      {/* === SLIDE-UP LIST VIEW === */}
      {showListView && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end pointer-events-none">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto animate-in fade-in transition-opacity"
            onClick={() => setShowListView(false)}
          />
          
          {/* Panel */}
          <div className="bg-slate-50 h-[85vh] rounded-t-3xl shadow-2xl pointer-events-auto flex flex-col relative animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-3 bg-white rounded-t-3xl border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <List className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-[1.1rem] font-bold text-slate-900">Nearby Chargers</h2>
                  <p className="text-[0.75rem] text-slate-400 font-medium">{filtered.length} locations found</p>
                </div>
              </div>
              <button 
                onClick={() => setShowListView(false)}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors shadow-sm"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-5 no-scrollbar">
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
        </div>
      )}
    </div>
  );
}