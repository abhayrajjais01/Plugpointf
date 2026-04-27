// We import standard React hooks: 
// - createContext & useContext: to share data (like user info) across all screens
// - useState: to store data that can change (like the list of chargers)
// - useEffect: to run code automatically (like fetching data when the app starts)
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// These "types" define what a User or a Charger object must look like
import {
  type User,
  type Charger,
  type Booking,
  type Review,
} from "../data/mock-data";

import type { UserVehicle } from "../data/ev-data";

// This hook handles the technical details of Firebase login/logout
import { useFirebaseAuth } from "../../hooks/useFirebaseAuth";

// These are our database helper functions (Supabase) to save/load data
import {
  fetchChargers,
  fetchBookings,
  fetchReviews,
  insertBooking,
  updateBookingStatus,
  insertReview as dbInsertReview,
  insertCharger,
  updateCharger as dbUpdateCharger,
  deleteCharger as dbDeleteCharger,
  upsertProfile,
  fetchWalletBalance,
  updateWalletBalance,
} from "../../lib/db";

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  chargers: Charger[];
  bookings: Booking[];
  reviews: Review[];
  authLoading: boolean;
  authError: string | null;
  dataLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  addBooking: (booking: Omit<Booking, "id">) => Promise<Booking | null>;
  cancelBooking: (id: string) => Promise<void>;
  addReview: (review: Pick<Review, "chargerId" | "userId" | "userName" | "userAvatar" | "rating" | "comment">) => Promise<void>;
  addCharger: (charger: Omit<Charger, "id">) => Promise<Charger | null>;
  updateCharger: (id: string, updates: Partial<Omit<Charger, "id">>) => Promise<boolean>;
  deleteCharger: (id: string) => Promise<boolean>;
  refreshBookings: () => Promise<void>;
  topUpWallet: (amount: number, paymentId: string) => Promise<boolean>;
  payWithWallet: (amount: number, description: string) => Promise<boolean>;
  fetchPublicChargers: (lat: number, lng: number) => Promise<void>;
  fetchPublicChargersForRoute: (polyline: string, distance?: number) => Promise<void>;
  isNavigating: boolean;
  setIsNavigating: React.Dispatch<React.SetStateAction<boolean>>;
  tripState: {
    origin: string;
    destination: string;
    isLoading: boolean;
    routeData: any | null;
    distance: number | null;
    duration: number | null;
    error: string | null;
  };
  setTripState: React.Dispatch<React.SetStateAction<{
    origin: string;
    destination: string;
    isLoading: boolean;
    routeData: any | null;
    distance: number | null;
    duration: number | null;
    error: string | null;
  }>>;
  myVehicles: UserVehicle[];
  setMyVehicles: React.Dispatch<React.SetStateAction<UserVehicle[]>>;
  activeVehicle: UserVehicle | null;
  setActiveVehicle: React.Dispatch<React.SetStateAction<UserVehicle | null>>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const {
    firebaseUser,
    loading: authLoading,
    error: authError,
    signup: firebaseSignup,
    login: firebaseLogin,
    loginWithGoogle: firebaseLoginWithGoogle,
    logout: firebaseLogout,
  } = useFirebaseAuth();

  const [user, setUser] = useState<User | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
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
    distance: null,
    duration: null,
    error: null,
  });

  const [myVehicles, setMyVehicles] = useState<UserVehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<UserVehicle | null>(null);

  // Load EVs on mount
  useEffect(() => {
    const savedVehicles = localStorage.getItem("plugpoint_my_vehicles");
    const savedActive = localStorage.getItem("plugpoint_active_vehicle_id");
    
    // Migration: If no myVehicles exist, check for legacy plugpoint_my_ev
    if (!savedVehicles) {
      const legacyEv = localStorage.getItem("plugpoint_my_ev");
      if (legacyEv) {
        try {
          const parsed = JSON.parse(legacyEv);
          type LegacyEVDetails = { make: string; model: string; image?: string; pluginType?: string };
          const details: LegacyEVDetails = parsed;
          const migratedVehicle: UserVehicle = {
            id: "legacy_" + Date.now(),
            modelId: "legacy",
            brandName: details.make || "Unknown",
            modelName: details.model || details.make || "My EV",
            image: details.image || "/cars/m1.jpeg",
            logoUrl: ""
          };
          setMyVehicles([migratedVehicle]);
          setActiveVehicle(migratedVehicle);
          // Remove legacy key after migration
          localStorage.removeItem("plugpoint_my_ev");
          return; // Exit early as we've initialized with legacy data
        } catch (e) {
          console.error("Failed to migrate legacy EV data", e);
        }
      }
    }

    if (savedVehicles) {
      try {
        const parsed = JSON.parse(savedVehicles);
        setMyVehicles(parsed);
        if (savedActive) {
          const active = parsed.find((v: UserVehicle) => v.id === savedActive);
          if (active) setActiveVehicle(active);
        } else if (parsed.length > 0) {
          setActiveVehicle(parsed[0]);
        }
      } catch (e) {}
    }
  }, []);

  // Save vehicles whenever they change
  useEffect(() => {
    localStorage.setItem("plugpoint_my_vehicles", JSON.stringify(myVehicles));
  }, [myVehicles]);

  useEffect(() => {
    if (activeVehicle) {
       localStorage.setItem("plugpoint_active_vehicle_id", activeVehicle.id);
    } else {
       localStorage.removeItem("plugpoint_active_vehicle_id");
    }
  }, [activeVehicle]);

  // --- STEP 1: INITIAL DATA LOAD ---
  // This runs exactly once when the app first opens.
  // It fetches all chargers and reviews from our Supabase database.
  useEffect(() => {
    // Promise.all runs multiple fetch requests at the same time for speed
    Promise.all([fetchChargers(), fetchReviews()]).then(([c, r]) => {
      setChargers(c); // Store the chargers in our global state
      setReviews(r);  // Store the reviews
      setDataLoading(false); // Stop showing the loading spinner
    });
  }, []);

  // --- STEP 1b: AUTO-FETCH NEARBY PUBLIC CHARGERS ---
  // As soon as the app opens, get the user's GPS location and fetch
  // nearby public chargers from Open Charge Map. This ensures the
  // home page shows real chargers immediately, not just demo/DB ones.
  const hasFetchedPublicRef = React.useRef(false);
  useEffect(() => {
    if (hasFetchedPublicRef.current) return; // Only run once
    hasFetchedPublicRef.current = true;

    // Fetch immediately for a default central location (e.g., Bangalore) 
    // to ensure data is displayed instantly without waiting for GPS permissions.
    fetchPublicChargers(12.96, 77.63);

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        // Fetch again for the user's real location and merge the results
        fetchPublicChargers(latitude, longitude);
      },
      (err) => {
        console.warn("Geolocation denied/unavailable, using default location:", err.message);
      },
      { timeout: 10000 }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- STEP 2: USER SYNC ---
  // Every time the Firebase login status changes (logged in or out), 
  // we update our local "User" object so the rest of the app knows who is browsing.
  useEffect(() => {
    if (firebaseUser) {
      // If a user is logged in, create a standard "User" object
      const appUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || "User",
        avatar: firebaseUser.photoURL || "https://i.pravatar.cc/150?img=33",
        email: firebaseUser.email || "",
        phone: firebaseUser.phoneNumber || "+91 99999 00000",
        joinedDate: "March 2026",
        chargersListed: 0,
        totalBookings: 0,
        rating: 5.0,
        verified: !!firebaseUser.emailVerified,
        walletBalance: 50000,
      };
      setUser(appUser);

      // We also sync this info to our own Supabase 'profiles' table 
      // so we can store extra details like their phone number or custom avatar.
      upsertProfile({
        id: firebaseUser.uid,
        name: appUser.name,
        avatar: appUser.avatar,
        email: appUser.email,
        phone: appUser.phone,
      });

      fetchWalletBalance(firebaseUser.uid).then(balance => {
        setUser(prev => prev ? { ...prev, walletBalance: balance } : null);
      });

      // Finally, load all the bookings that belong to this specific user.
      fetchBookings(firebaseUser.uid).then(setBookings);
    } else {
      // If logged out, clear the user and their bookings
      setUser(null);
      setBookings([]);
    }
  }, [firebaseUser]); // This effect re-runs only if firebaseUser changes

  const login = async (email: string, password: string) => {
    await firebaseLogin(email, password);
  };

  const signup = async (name: string, email: string, password: string) => {
    await firebaseSignup(name, email, password);
  };

  const loginWithGoogle = async () => {
    await firebaseLoginWithGoogle();
  };

  const logout = async () => {
    await firebaseLogout();
  };

  const addBooking = async (booking: Omit<Booking, "id">): Promise<Booking | null> => {
    if (!firebaseUser) return null;
    const saved = await insertBooking(booking, firebaseUser.uid);
    if (saved) setBookings((prev) => [saved, ...prev]);
    return saved;
  };

  const cancelBooking = async (id: string) => {
    await updateBookingStatus(id, "cancelled");
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b))
    );
  };

  const addReview = async (
    review: Pick<Review, "chargerId" | "userId" | "userName" | "userAvatar" | "rating" | "comment">
  ) => {
    const saved = await dbInsertReview(review);
    if (!saved) return;
    setReviews((prev) => [saved, ...prev]);
    // Refresh charger rating locally
    setChargers((prev) =>
      prev.map((c) => {
        if (c.id !== review.chargerId) return c;
        const all = [...reviews.filter((r) => r.chargerId === c.id), saved];
        const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
        return { ...c, rating: Math.round(avg * 10) / 10, reviewCount: c.reviewCount + 1 };
      })
    );
  };

  const addCharger = async (charger: Omit<Charger, "id">): Promise<Charger | null> => {
    const saved = await insertCharger(charger);
    if (saved) setChargers((prev) => [saved, ...prev]);
    return saved;
  };

  const updateCharger = async (id: string, updates: Partial<Omit<Charger, "id">>): Promise<boolean> => {
    const updated = await dbUpdateCharger(id, updates);
    if (updated) {
      setChargers((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return true;
    }
    return false;
  };

  const deleteCharger = async (id: string): Promise<boolean> => {
    const success = await dbDeleteCharger(id);
    if (success) {
      setChargers((prev) => prev.filter((c) => c.id !== id));
      return true;
    }
    return false;
  };

  const refreshBookings = async () => {
    if (!firebaseUser) return;
    const fresh = await fetchBookings(firebaseUser.uid);
    setBookings(fresh);
  };

  const topUpWallet = async (amount: number, paymentId: string) => {
    if (!firebaseUser) return false;
    const success = await updateWalletBalance(firebaseUser.uid, amount, 'credit', 'Wallet Top-up via Razorpay', paymentId);
    if (success) {
      setUser(prev => prev ? { ...prev, walletBalance: prev.walletBalance + amount } : null);
    }
    return success;
  };

  const payWithWallet = async (amount: number, description: string) => {
    if (!firebaseUser) return false;
    const success = await updateWalletBalance(firebaseUser.uid, amount, 'debit', description);
    if (success) {
      setUser(prev => prev ? { ...prev, walletBalance: prev.walletBalance - amount } : null);
    }
    return success;
  };

  // This function fetches real-world EV chargers near a specific Latitude/Longitude.
  // We use the "Open Charge Map" (OCM) API to get this data.
  const fetchPublicChargers = async (lat: number, lng: number) => {
    try {
      // 1. Get our secret API key from the environment variables (.env file)
      const apiKey = (import.meta as any).env.VITE_OCM_API_KEY || '';

      // 2. Build the URL. We ask for chargers within 15 KM of the user.
      const url = `https://api.openchargemap.io/v3/poi?output=json&latitude=${lat}&longitude=${lng}&distance=15&distanceunit=KM&maxresults=40` + (apiKey ? `&key=${apiKey}` : '');

      const res = await fetch(url);
      if (!res.ok) return; // If the API is down or the key is wrong, just stop here.
      const data = await res.json();

      // 3. The API gives us a lot of raw data. We "map" (transform) it into our 
      // standard "Charger" format so the rest of our app can display it easily.
      const publicChargers: Charger[] = data.map((poi: any) => ({
        id: `ocm-${poi.ID}`, // Prefix with 'ocm-' to avoid ID crashes with mock data
        ownerId: `ocm-network`,
        ownerName: poi.OperatorInfo?.Title || 'Public Station',
        ownerAvatar: "https://images.unsplash.com/photo-1548625361-9d10e8c8942b?w=150&h=150&fit=crop",
        ownerRating: 4.0,
        title: poi.AddressInfo?.Title || 'Public EV Charger',
        description: poi.GeneralComments || "Public charging station provided via Open Charge Map.",
        image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1080&h=720&fit=crop",
        address: poi.AddressInfo?.AddressLine1 || 'Public Location',
        city: poi.AddressInfo?.Town || '',
        lat: poi.AddressInfo?.Latitude,
        lng: poi.AddressInfo?.Longitude,
        connectorType: poi.Connections?.[0]?.ConnectionType?.Title || 'Universal',
        power: poi.Connections?.[0]?.PowerKW || 7.2,
        pricePerHour: 100, // Standard price since API doesn't always provide it
        pricePerKwh: 15,
        available: true,
        availableHours: "24/7",
        rating: 4.5,
        reviewCount: 0,
        amenities: ["Public Access"],
        instructions: poi.AddressInfo?.AddressLine1 || "Public usage. Follow operator instructions on site.",
        verified: true,
      }));

      // 4. Merge the new data with what we already have.
      setChargers(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        // Only add chargers we haven't seen before to avoid showing duplicates on the map
        const newChargers = publicChargers.filter(c => !existingIds.has(c.id));
        return [...prev, ...newChargers];
      });
    } catch (err) {
      console.error("Failed to fetch OCM data:", err);
    }
  };

  // This is a special version that searches for chargers along a driving path (Polyline).
  const fetchPublicChargersForRoute = async (polyline: string, distance: number = 5) => {
    try {
      const apiKey = (import.meta as any).env.VITE_OCM_API_KEY || '';

      // We pass the 'polyline' string. The API finds chargers within the specified detour distance.
      const url = `https://api.openchargemap.io/v3/poi?output=json&polyline=${encodeURIComponent(polyline)}&distance=${distance}&distanceunit=KM&maxresults=500` + (apiKey ? `&key=${apiKey}` : '');

      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();

      const publicChargers: Charger[] = data.map((poi: any) => ({
        id: `ocm-${poi.ID}`,
        ownerId: `ocm-network`,
        ownerName: poi.OperatorInfo?.Title || 'Public Station',
        ownerAvatar: "https://images.unsplash.com/photo-1548625361-9d10e8c8942b?w=150&h=150&fit=crop",
        ownerRating: 4.0,
        title: poi.AddressInfo?.Title || 'Public EV Charger',
        description: poi.GeneralComments || "Public charging station provided via Open Charge Map.",
        image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1080&h=720&fit=crop",
        address: poi.AddressInfo?.AddressLine1 || 'Public Location',
        city: poi.AddressInfo?.Town || '',
        lat: poi.AddressInfo?.Latitude,
        lng: poi.AddressInfo?.Longitude,
        connectorType: poi.Connections?.[0]?.ConnectionType?.Title || 'Universal',
        power: poi.Connections?.[0]?.PowerKW || 7.2,
        pricePerHour: 100,
        pricePerKwh: 15,
        available: true,
        availableHours: "24/7",
        rating: 4.5,
        reviewCount: 0,
        amenities: ["Public Access", "On Route"], // Tag them so we know they are route-specific
        instructions: poi.AddressInfo?.AccessComments || "Public usage. Follow operator instructions on site.",
        verified: true,
      }));

      // 5. Again, merge without duplicates
      setChargers(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newChargers = publicChargers.filter(c => !existingIds.has(c.id));
        return [...prev, ...newChargers];
      });
    } catch (err) {
      console.error("Failed to fetch route-based OCM data:", err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!firebaseUser,
        chargers,
        bookings,
        reviews,
        authLoading,
        authError,
        dataLoading,
        userLocation,
        login,
        signup,
        loginWithGoogle,
        logout,
        addBooking,
        cancelBooking,
        addReview,
        addCharger,
        updateCharger,
        deleteCharger,
        refreshBookings,
        topUpWallet,
        payWithWallet,
        fetchPublicChargers,
        fetchPublicChargersForRoute,
        isNavigating,
        setIsNavigating,
        tripState,
        setTripState,
        myVehicles,
        setMyVehicles,
        activeVehicle,
        setActiveVehicle,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
