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
  User,
  ArrowLeft,
  Heart
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ChargerCard } from "./ChargerCard";
import { EvSetupModal } from "./EvSetupModal";
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

// Helper to prevent OpenChargeMap API from failing due to URL lengths on very long trips (> 1000km)
function getSimplifiedPolyline(coordinates: [number, number][], maxPoints = 150) {
  if (coordinates.length <= maxPoints) return encodePolyline(coordinates);
  
  const step = Math.ceil(coordinates.length / maxPoints);
  const sampled: [number, number][] = [];
  for (let i = 0; i < coordinates.length; i += step) {
    sampled.push(coordinates[i]);
  }
  // Ensure the final destination point is always included
  if (sampled[sampled.length - 1] !== coordinates[coordinates.length - 1]) {
    sampled.push(coordinates[coordinates.length - 1]);
  }
  return encodePolyline(sampled);
}

// Helper to reliably format duration into hours and minutes
function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h > 0) return `${h}hr ${m > 0 ? m + 'min' : ''}`.trim();
  return `${m}min`;
}

export function MapPage() {
  const { chargers, fetchPublicChargers, fetchPublicChargersForRoute, user, tripState, setTripState, isNavigating, setIsNavigating, activeVehicle } = useApp();
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
  const [isEvSetupOpen, setIsEvSetupOpen] = useState(false);
  const [detourDistance, setDetourDistance] = useState<number>(5);
  const [showDetourDropdown, setShowDetourDropdown] = useState(false);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleDestinationChange = (val: string) => {
    setTripState(s => ({...s, destination: val}));
    if (val.length > 2) {
      if (suggestionTimeout.current) clearTimeout(suggestionTimeout.current);
      suggestionTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val + ", India")}&limit=4`);
          const data = await res.json();
          setDestSuggestions(data);
          setShowSuggestions(true);
        } catch(e) {}
      }, 500);
    } else {
      setShowSuggestions(false);
      setDestSuggestions([]);
    }
  };

  // --- REFS ---
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const routeLabelRef = useRef<maplibregl.Marker | null>(null);
  const exactLocationNameRef = useRef<string | null>(null);
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
      matchRoute = dist <= detourDistance;
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
      const isExactGpsMatch = exactLocationNameRef.current && tripState.origin === exactLocationNameRef.current;

      if (tripState.origin.toLowerCase() === "my location" || tripState.origin.trim() === "" || isExactGpsMatch) {
        if (userMarkerRef.current) {
          const lngLat = userMarkerRef.current.getLngLat();
          originCoords = [lngLat.lng, lngLat.lat];
          // We keep the exact text they see on screen for origin
        } else {
          throw new Error("Could not detect location. Please explicitly type an address.");
        }
      } else {
        exactLocationNameRef.current = null;
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
      const distance = routeData.routes[0].distance; // meters
      const duration = routeData.routes[0].duration; // seconds
      
      setTripState((s) => ({ 
        ...s, 
        routeData: geojsonData, 
        distance: distance / 1000, 
        duration: duration / 60,
        isLoading: false 
      }));
      // Switch back to map to show the route
      setActiveNavTab("map"); 
    } catch (err: any) {
      setTripState((s) => ({
        ...s,
        isLoading: false,
        error: err.message || "Failed to calculate trip.",
      }));
    }
  };

  // Refetch chargers dynamically if route data exists and the user alters the detourDistance logic
  useEffect(() => {
    if (tripState.routeData && detourDistance) {
      const polylineStr = getSimplifiedPolyline(tripState.routeData.coordinates);
      fetchPublicChargersForRoute(polylineStr, detourDistance);
    }
  }, [detourDistance, tripState.routeData]);

  const getGPSLocation = async () => {
      setTripState(s => ({...s, origin: "Locating...", error: null}));

      const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          const addr = data.address;
          if (!addr) return "My Location";
          return addr.neighbourhood || addr.suburb || addr.city_district || addr.city || addr.town || addr.village || data.display_name.split(",")[0] || "My Location";
        } catch(e) {
          return "My Location";
        }
      };

      try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { 
                timeout: 10000, 
                maximumAge: 60000, 
                enableHighAccuracy: true 
            });
          });
          const locName = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setTripState(s => ({...s, origin: locName}));
          exactLocationNameRef.current = locName;
          
          if (userMarkerRef.current && mapRef.current) {
               userMarkerRef.current.setLngLat([pos.coords.longitude, pos.coords.latitude]);
               mapRef.current.flyTo({
                 center: [pos.coords.longitude, pos.coords.latitude],
                 zoom: 14,
               });
          }
      } catch (e) {
          // GPS Failed, try fetching rough IP-based location as fallback
          try {
             const res = await fetch("https://ipapi.co/json/");
             if (!res.ok) throw new Error("IP API failed");
             const data = await res.json();
             if (data.latitude && data.longitude) {
                 const locName = await reverseGeocode(data.latitude, data.longitude);
                 const finalLocName = locName !== "My Location" ? locName : (data.city || "My Location");
                 setTripState(s => ({...s, origin: finalLocName}));
                 exactLocationNameRef.current = finalLocName;

                 if (userMarkerRef.current && mapRef.current) {
                      userMarkerRef.current.setLngLat([data.longitude, data.latitude]);
                      mapRef.current.flyTo({
                        center: [data.longitude, data.latitude],
                        zoom: 12, // zoom out a bit since IP is inaccurate
                      });
                 }
             } else {
                 throw new Error("No IP location Data");
             }
          } catch(fallbackErr) {
             setTripState(s => ({...s, origin: "", error: "Could not track location. Please explicitly type an address."}));
          }
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

    // Cleanup
    if (map.getLayer('route')) map.removeLayer('route');
    if (map.getLayer('detour-border')) map.removeLayer('detour-border');
    if (map.getSource('route')) map.removeSource('route');
    if (routeLabelRef.current) {
      routeLabelRef.current.remove();
      routeLabelRef.current = null;
    }

    if (tripState.routeData) {
      map.addSource('route', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': tripState.routeData
        }
      });

      // 1. Detour Border (The "Orange Border" denoting detour area)
      const detourBorderWidth = Math.max(12, (detourDistance / 5) * 24);
      // Decrease opacity as width increases to prevent stacking from turning the route into a dark solid orange polygon
      const detourBorderOpacity = Math.min(0.2, Math.max(0.04, 0.15 * (5 / detourDistance)));

      map.addLayer({
        'id': 'detour-border',
        'type': 'line',
        'source': 'route',
        'layout': { 'line-join': 'round', 'line-cap': 'round' },
        'paint': {
          'line-color': '#f97316',
          'line-width': detourBorderWidth,
          'line-opacity': detourBorderOpacity
        }
      });

      // 2. Main Route Line
      map.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': { 'line-join': 'round', 'line-cap': 'round' },
        'paint': {
          'line-color': '#2563eb',
          'line-width': 6,
          'line-opacity': 0.9
        }
      });

      // 3. Midpoint Label (Time to reach + Charger count)
      const coords = tripState.routeData.coordinates;
      const midIdx = Math.floor(coords.length / 2);
      const midCoord = coords[midIdx];

      const labelEl = document.createElement('div');
      labelEl.className = 'route-label-popup';
      labelEl.innerHTML = `
        <div style="background: white; padding: 6px 12px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 6px; white-space: nowrap;">
          <div style="width: 8px; height: 8px; background: #2563eb; rounded: 50%;"></div>
          <span style="font-size: 11px; font-weight: 800; color: #0f172a;">${formatDuration(tripState.duration || 0)}</span>
          <div style="width: 1px; height: 10px; background: #e2e8f0;"></div>
          <span style="font-size: 11px; font-weight: 800; color: #ea580c;">${filtered.length} Chargers</span>
        </div>
      `;

      routeLabelRef.current = new maplibregl.Marker({ element: labelEl })
        .setLngLat(midCoord)
        .addTo(map);

      // Fit bounds
      const bounds = coords.reduce((acc: maplibregl.LngLatBounds, coord: [number, number]) => {
        return acc.extend(coord);
      }, new maplibregl.LngLatBounds(coords[0], coords[0]));
      
      map.fitBounds(bounds, { padding: 100 });
    }
  }, [tripState.routeData, filtered.length, detourDistance]);

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
      
      {/* === DARK HEADER SECTION === */}
      <div className="absolute top-0 left-0 right-0 z-30 flex flex-col pointer-events-none pb-6" style={{ background: (tripState.routeData && activeNavTab === "map") || activeNavTab === "trip" ? 'transparent' : 'linear-gradient(to bottom, rgba(15, 27, 45, 0.9) 0%, rgba(15, 27, 45, 0.5) 60%, rgba(15, 27, 45, 0) 100%)' }}>
        
        {activeNavTab === "trip" && !tripState.routeData ? (
          // --- NEW TRIP HEADER ---
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-3 pt-3 pb-2 pointer-events-auto">
               <div className="flex items-center gap-2">
                   <button onClick={() => setIsEvSetupOpen(true)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white shadow-sm hover:bg-slate-50 transition-all font-bold text-slate-800 text-[13px]">
                     <div className="w-5 h-5 flex items-center justify-center">
                        {activeVehicle ? (
                          <img src={activeVehicle.logoUrl} alt={activeVehicle.brandName} className="w-5 h-5 object-contain" />
                        ) : (
                          <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center"><Zap className="w-3 h-3 text-slate-600" /></div>
                        )}
                     </div>
                     <span>{activeVehicle ? activeVehicle.modelName : "My EV"} <ChevronDown className="w-3.5 h-3.5 inline text-slate-400" /></span>
                   </button>
                   
                   <button disabled className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white opacity-90 shadow-sm font-semibold text-slate-400/80 text-[13px]">
                     Detour - 5km
                   </button>
               </div>
               <button onClick={() => setActiveNavTab('map')} className="w-[42px] h-[42px] bg-[#0c182a] rounded-xl shadow-md flex items-center justify-center active:scale-95 transition-all">
                 <Heart className="w-5 h-5 text-white stroke-2" />
               </button>
            </div>
            
            {/* Soft global toggle */}
            <div className="px-4 pb-3 pt-1 pointer-events-auto flex justify-center opacity-90 hover:opacity-100 transition-opacity">
              <div className="bg-white/90 backdrop-blur-md p-1 rounded-full flex items-center gap-1 w-full max-w-lg border border-slate-200 shadow-sm">
                <button 
                  onClick={() => setActiveNavTab('map')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition-all text-slate-600 hover:bg-slate-100"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Map
                </button>
                <button 
                  onClick={() => setActiveNavTab('trip')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition-all bg-slate-800 text-white shadow-md cursor-default"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Trip
                </button>
                <button 
                  onClick={() => setActiveNavTab('social')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition-all text-slate-600 hover:bg-slate-100"
                >
                  <Users className="w-3.5 h-3.5" />
                  Social
                </button>
              </div>
            </div>
          </div>
        ) : tripState.routeData && activeNavTab === "map" ? (
          // --- ACTIVE ROUTE HEADER ---
          <div className="flex items-center justify-between px-3 pt-12 pb-2 pointer-events-auto">
             <button onClick={() => setTripState(s => ({...s, routeData: null}))} className="w-11 h-11 bg-white rounded-xl shadow-md flex items-center justify-center border border-slate-100 hover:bg-slate-50 transition-all active:scale-95">
               <ArrowLeft className="w-5 h-5 text-slate-700" />
             </button>
             
             <div className="flex items-center gap-2">
                 <button onClick={() => setIsEvSetupOpen(true)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-full border border-slate-200 bg-white shadow-md hover:bg-slate-50 transition-all active:scale-95">
                   {activeVehicle ? (
                     <img src={activeVehicle.logoUrl} alt={activeVehicle.brandName} className="w-4 h-4 object-contain" />
                   ) : (
                     <Zap className="w-4 h-4 text-slate-400" />
                   )}
                   <span className="text-slate-400 text-xs font-semibold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">{activeVehicle ? activeVehicle.modelName : "My EV"}</span>
                   <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                 </button>

                 <div className="relative">
                   <button onClick={() => setShowDetourDropdown(!showDetourDropdown)} className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white shadow-md font-bold text-slate-800 text-sm hover:bg-slate-50 transition-all active:scale-95">
                     Detour - {detourDistance}km
                   </button>
                   {showDetourDropdown && (
                     <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                       {[2, 5, 10, 20, 50].map(d => (
                         <button key={d} onClick={() => {
                           setDetourDistance(d);
                           setShowDetourDropdown(false);
                           if (tripState.routeData) {
                             const polylineStr = getSimplifiedPolyline(tripState.routeData.coordinates);
                             fetchPublicChargersForRoute(polylineStr, d);
                           }
                         }} className={`w-full text-left px-5 py-3 text-sm transition-all ${detourDistance === d ? 'font-bold bg-blue-50 text-blue-600' : 'font-medium text-slate-600 hover:bg-slate-50'}`}>
                           {d}km
                         </button>
                       ))}
                     </div>
                   )}
                 </div>
             </div>

             <button className="w-11 h-11 bg-white rounded-xl shadow-md flex items-center justify-center border border-slate-100 hover:bg-slate-50 transition-all active:scale-95">
               <ChevronDown className="w-5 h-5 text-slate-700" />
             </button>
          </div>
        ) : (
          // --- DEFAULT MAP HEADER ---
          <>
            {/* Top Row: Vehicle selector + Rewards + Profile */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 pointer-events-auto">
              {/* Vehicle / EV Selector */}
              <button onClick={() => setIsEvSetupOpen(true)} className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all active:scale-95">
                <div className="w-5 h-5 rounded-full flex items-center justify-center">
                  {activeVehicle ? (
                     <img src={activeVehicle.logoUrl} alt={activeVehicle.brandName} className="w-5 h-5 object-contain" />
                  ) : (
                     <div className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center"><Zap className="w-3 h-3 text-white" /></div>
                  )}
                </div>
                <span className="text-white text-xs font-semibold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">{activeVehicle ? activeVehicle.modelName : "My EV"}</span>
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
              <div className="bg-white/10 backdrop-blur-md p-1 rounded-full flex items-center gap-1 w-full max-w-lg border border-white/20">
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
          </>
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

      {/* === TRIP PLANNING PANEL (Bottom Sheet matches Image) === */}
      {activeNavTab === "trip" && !tripState.routeData && (
        <div className="absolute bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom pointer-events-none">
          <div className="bg-white pointer-events-auto px-4 pt-4 pb-4 rounded-t-[1.25rem] shadow-[0_-8px_30px_rgb(0,0,0,0.08)] w-full relative">
            <h2 className="text-[#0f172a] text-base font-bold mb-0.5 tracking-tight flex items-center gap-2">
              Plan your next trip
            </h2>
            <p className="text-[11px] text-slate-500 leading-tight mb-3 tracking-wide font-medium">
              Tackle your range anxiety with our hassle - free charging experience on your next trip.
            </p>
            
            <div className="relative pl-[0.65rem] mb-3">
              {/* Vertical Dashed Line */}
              <div className="absolute left-[0.7rem] top-[0.9rem] bottom-[0.9rem] w-0 border-l-[1.5px] border-dashed border-slate-300 pointer-events-none"></div>
              
              <div className="flex flex-col gap-1.5">
                <div className="relative flex items-center">
                  {/* Top dot */}
                  <div className="absolute -left-[0.45rem] w-1.5 h-1.5 rounded-full border-[1.5px] border-slate-300 bg-white z-10 box-content"></div>
                  <input 
                    type="text" 
                    placeholder="Enter Location" 
                    value={tripState.origin}
                    onChange={(e) => {
                       const val = e.target.value;
                       setTripState(s => ({...s, origin: val}));
                       if (exactLocationNameRef.current && val !== exactLocationNameRef.current) {
                           exactLocationNameRef.current = null;
                       }
                    }}
                    className="w-full text-xs ml-2.5 font-bold text-slate-700 px-3 py-2 bg-white border-[1.5px] border-slate-200/50 rounded-lg shadow-[0_2px_10px_rgb(0,0,0,0.02)] focus:ring-2 focus:ring-slate-200 transition-all outline-none placeholder:text-slate-300 placeholder:font-semibold"
                  />
                  <button onClick={getGPSLocation} className="absolute right-2 p-1 transition-all active:scale-95 text-[#0f172a] opacity-80 hover:opacity-100">
                    <LocateFixed className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative flex items-center">
                  {/* Bottom dot */}
                  <div className="absolute -left-[0.45rem] w-1.5 h-1.5 rounded-full border-[1.5px] border-slate-300 bg-white z-10 box-content"></div>
                  <input 
                    type="text" 
                    placeholder="Enter Destination" 
                    value={tripState.destination}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    onFocus={() => { if (destSuggestions.length > 0) setShowSuggestions(true); }}
                    className="w-full text-xs ml-2.5 font-bold text-slate-700 px-3 py-2 bg-white border-[1.5px] border-slate-200/50 rounded-lg shadow-[0_2px_10px_rgb(0,0,0,0.02)] focus:ring-2 focus:ring-slate-200 transition-all outline-none placeholder:text-slate-300 placeholder:font-semibold"
                  />
                  {/* Autocomplete Dropdown */}
                  {showSuggestions && destSuggestions.length > 0 && (
                    <div className="absolute top-full left-[0.6rem] right-0 mt-1 bg-white border border-slate-100 rounded-lg shadow-[0_4px_20px_rgb(0,0,0,0.08)] z-50 overflow-hidden">
                      {destSuggestions.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setTripState(s => ({ ...s, destination: item.display_name.split(",")[0] }));
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2.5 text-[10.5px] font-bold text-slate-600 hover:bg-slate-50 border-b border-slate-50 last:border-0 truncate flex items-center gap-2 transition-colors"
                        >
                          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{item.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {tripState.error && <p className="text-red-500 text-[10px] mt-0.5 mb-1.5 font-semibold px-1">{tripState.error}</p>}
            
            <button 
              onClick={calculateTrip}
              disabled={tripState.isLoading || (!tripState.origin && !tripState.destination)}
              className="w-full mt-0.5 bg-[#0c182a] text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors active:scale-95 shadow-md disabled:bg-slate-100 disabled:text-slate-400"
            >
              {tripState.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Plan Trip"}
            </button>
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

  
      {/* === BOTTOM ROUTE INFO SHEET & FLOATING CONTROLS === */}
      {activeNavTab === "map" && tripState.routeData && !isNavigating && (
        <div className="absolute bottom-0 left-0 right-0 z-30 animate-in slide-in-from-bottom flex flex-col items-center pointer-events-none">
          
          {/* Controls overlapping top edge */}
          <div className="w-full flex justify-between items-end px-4 relative z-40 pointer-events-none -mb-9">
            {/* Center Group (Start Journey + X) */}
            <div className="flex-1 flex justify-center gap-3 pl-[3.5rem] pointer-events-auto">
               <button 
                  onClick={() => {
                    setIsNavigating(true);
                    if (mapRef.current && userMarkerRef.current) {
                      const location = userMarkerRef.current.getLngLat() || mapRef.current.getCenter();
                      mapRef.current.flyTo({ center: location, zoom: 16, pitch: 45 });
                    }
                  }}
                  className="bg-[#1d4ed8] text-white px-8 py-4 rounded-[1.75rem] shadow-xl font-bold flex items-center justify-center gap-2.5 hover:bg-blue-800 transition-all active:scale-95"
               >
                 <Navigation className="w-5 h-5 fill-current rotate-45 -ml-1" />
                 Start Journey
               </button>
               
               <button 
                 onClick={() => setTripState(s => ({ ...s, routeData: null }))}
                 className="w-[3.5rem] h-[3.5rem] flex-shrink-0 bg-white text-slate-500 rounded-[1.75rem] shadow-xl border border-slate-100 flex items-center justify-center hover:text-red-500 transition-all active:scale-95"
                 title="Clear Route"
               >
                 <X className="w-5 h-5" strokeWidth={2} />
               </button>
            </div>

            {/* Right side Map Tools */}
            <div className="flex flex-col gap-2 pointer-events-auto">
              <button
                onClick={centerOnUser}
                className="w-[2.75rem] h-[2.75rem] bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
              >
                <LocateFixed className="w-4.5 h-4.5 text-slate-700" />
              </button>
              <button
                onClick={() => setShowListView(true)}
                className="w-[2.75rem] h-[2.75rem] bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
              >
                <List className="w-4.5 h-4.5 text-slate-700" />
              </button>
            </div>
          </div>

          {/* Card container */}
          <div className="bg-white pointer-events-auto px-6 pt-11 pb-4 rounded-t-[2rem] shadow-[0_-8px_30px_rgb(0,0,0,0.08)] w-full relative z-30">
             <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight mb-0.5 tracking-tight">
                     Route Summary
                  </h3>
                  <p className="text-[0.8rem] text-slate-500 font-medium tracking-tight">via driving route</p>
                  
                  <div className="flex items-center gap-1.5 mt-2.5 text-slate-700 text-sm font-semibold">
                    <span>{tripState.distance?.toFixed(2)}km</span>
                    <span className="text-slate-300">|</span>
                    <span>{formatDuration(tripState.duration || 0)}</span>
                  </div>
                  
                  <p className="text-[#ea580c] text-[0.8rem] font-bold mt-1.5">
                    {filtered.length} Charging Stops
                  </p>
                </div>
                
                {/* Right side Location Pin Icon like image */}
                <div className="w-12 h-12 flex items-center justify-center relative mt-1">
                   <div className="absolute w-8 h-8 rounded-full bg-red-100/50"></div>
                   <MapPin className="w-8 h-8 text-red-500 fill-white relative z-10 drop-shadow-md" />
                   <div className="absolute -top-1 -right-1 bg-[#ea580c] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full z-20 border border-white">
                      {filtered.length}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* === MAP CONTAINER === */}
      <div ref={mapContainerRef} className="flex-1 z-0" />

      {/* === FLOATING ACTION BUTTONS (Right side) === */}
      {activeNavTab === "map" && !tripState.routeData && (
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
      {activeNavTab === "map" && (!tripState.routeData || isNavigating) && (
        <div className="absolute bottom-2 left-0 right-0 z-20 transition-all duration-300">
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

      {/* EV SETUP MODAL */}
      <EvSetupModal isOpen={isEvSetupOpen} onClose={() => setIsEvSetupOpen(false)} />
    </div>
  );
}