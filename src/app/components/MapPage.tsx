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
  Maximize2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { Charger } from "../data/mock-data";
import { encodePolyline } from "../../lib/polyline";

// Map center for Bangalore
const MAP_CENTER: [number, number] = [77.63, 12.96]; // [lng, lat] for MapLibre
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

export function MapPage() {
  const { chargers, fetchPublicChargers, fetchPublicChargersForRoute } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get("tab");

  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);
  const [filterConnector, setFilterConnector] = useState("All");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Trip Planner State
  const [isTripPanelOpen, setIsTripPanelOpen] = useState(tabParam === "trip");
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

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Filter logic
  const filtered = chargers.filter((c) => {
    const matchConnector =
      filterConnector === "All" || c.connectorType === filterConnector;
    const matchAvailable = !showOnlyAvailable || c.available;
    
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
      setIsTripPanelOpen(false);

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
          
          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([longitude, latitude]);
          }

          if (mapRef.current) {
            mapRef.current.flyTo({
              center: [longitude, latitude],
              zoom: 14
            });
          }

          // Fetch public chargers nearby
          fetchPublicChargers(latitude, longitude);

          if (chargers.length > 0) {
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
          }
        },
        (err) => console.error("Initial location error:", err),
        { timeout: 10000 }
      );

      // Then watch position for live updates
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { longitude, latitude } = pos.coords;
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
  }, [chargers, isNavigating]);

  // Update trip link param
  useEffect(() => {
    if (tabParam === "trip") {
      setIsTripPanelOpen(true);
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
          width: 32px; height: 40px; cursor: pointer;
        `;
        
        // Add an inner div that we can safely transform for hover/selection scaling without conflicting with MapLibre
        el.innerHTML = `
        <div class="marker-inner" style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: bottom center; transform: ${scale}">
          <svg class="marker-bg" viewBox="0 0 24 24" fill="${pinFill}" stroke="${pinStroke}" stroke-width="1.5" style="width: 36px; height: 36px; position: absolute; bottom: 0; left: -2px; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3)); z-index: 0; transition: fill 0.2s, stroke 0.2s;">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="position: relative; z-index: 1; margin-bottom: 6px;">
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

  return (
    <div className="relative h-full flex flex-col overflow-hidden bg-slate-50">
      {/* Navigation Mode Header */}
      {isNavigating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
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

      {/* Start Journey Overlay */}
      {tripState.routeData && !isNavigating && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8">
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
        </div>
      )}

      {/* Top Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex gap-2 py-1 overflow-x-auto no-scrollbar pointer-events-auto items-center">
          <button
            onClick={() => setIsTripPanelOpen(!isTripPanelOpen)}
            className={`px-3 py-1.5 rounded-full text-[0.75rem] whitespace-nowrap shadow-md transition-all flex items-center gap-1.5 font-medium border ${
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
              className={`px-3 py-1.5 rounded-full text-[0.75rem] whitespace-nowrap shadow-md transition-all font-medium border ${
                filterConnector === type || (type === "Tesla" && filterConnector === "Tesla Wall Connector")
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-foreground border-border"
              }`}
            >
              {type}
            </button>
          ))}
          
          <button
            onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
            className={`px-3 py-1.5 rounded-full text-[0.75rem] whitespace-nowrap shadow-md transition-all font-medium border ${
              showOnlyAvailable ? "bg-emerald-500 text-white border-emerald-600" : "bg-white text-foreground border-border"
            }`}
          >
            Available Now
          </button>
        </div>

        {/* Trip Panel */}
        {isTripPanelOpen && (
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 flex flex-col gap-3 w-full max-w-sm mt-1 pointer-events-auto animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between">
               <h3 className="font-bold text-[0.875rem] flex items-center gap-2">
                   <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                     <Navigation className="w-4 h-4 text-blue-600"/>
                   </div>
                   Plan your trip
               </h3>
               <button onClick={() => setIsTripPanelOpen(false)} className="p-1.5 hover:bg-muted rounded-full">
                 <X className="w-4 h-4" />
               </button>
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
        )}
      </div>

      {/* Map */}
      <div ref={mapContainerRef} className="flex-1 z-0" />

      {/* Charger Details Card */}
      {selectedCharger && (
        <div className="absolute bottom-6 left-4 right-4 z-20 animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 overflow-hidden flex flex-col">
            <button onClick={() => setSelectedCharger(null)} className="absolute top-3 right-3 z-30 p-2 bg-slate-100/50 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-4 h-4 text-slate-800" />
            </button>
            <div className="flex gap-4 p-4">
              <div className="w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg relative bg-slate-100">
                <ImageWithFallback src={selectedCharger.image} alt={selectedCharger.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight truncate">{selectedCharger.title}</h3>
                    {selectedCharger.verified && <Shield className="w-4 h-4 text-emerald-500 fill-emerald-50" />}
                  </div>
                  <p className="text-sm text-slate-500 truncate mt-0.5">{selectedCharger.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 stroke-amber-500" /> {selectedCharger.rating}
                    </div>
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider">{selectedCharger.connectorType}</span>
                    <span className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-slate-400" /> {selectedCharger.power} kW
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-slate-900 leading-none">₹{selectedCharger.pricePerHour}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">per hour</span>
                  </div>
                  <button onClick={() => navigate(`/charger/${selectedCharger.id}`)} className="bg-primary text-white font-bold px-6 py-2.5 rounded-2xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Info */}
      {!selectedCharger && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 transition-transform duration-300">
          <div className="bg-slate-900/90 backdrop-blur-md text-white shadow-2xl rounded-full px-5 py-2.5 flex items-center gap-3 border border-white/10">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-black">{filtered.length}</div>
            <span className="text-xs font-bold tracking-tight">
              chargers {tripState.routeData ? 'on your route' : 'nearby you'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}