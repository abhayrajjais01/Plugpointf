// We import standard React hooks: 
// - createContext & useContext: to share data (like user info) across all screens
// - useState: to store data that can change (like the list of chargers)
// - useEffect: to run code automatically (like fetching data when the app starts)
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// These "types" define what a User or a Charger object must look like
import type {
  User,
  Charger,
  Booking,
  Review,
  TripState,
} from "../../types";

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
  fetchProfile,
  fetchWalletBalance,
  updateWalletBalance,
  fetchUserVehicles,
  upsertUserVehicle,
  deleteUserVehicle as dbDeleteUserVehicle,
} from "../../lib/db";
import {
  fetchPublicChargersAlongRoute,
  fetchPublicChargersNear,
} from "../../services/publicChargers";

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
  addReview: (review: Pick<Review, "chargerId" | "bookingId" | "userId" | "userName" | "userAvatar" | "rating" | "comment">) => Promise<void>;
  addCharger: (charger: Omit<Charger, "id">) => Promise<Charger | null>;
  updateCharger: (id: string, updates: Partial<Omit<Charger, "id">>) => Promise<boolean>;
  deleteCharger: (id: string) => Promise<boolean>;
  refreshBookings: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, "name" | "phone" | "avatar">>) => Promise<boolean>;
  topUpWallet: (amount: number, paymentId: string) => Promise<boolean>;
  payWithWallet: (amount: number, description: string) => Promise<boolean>;
  fetchPublicChargers: (lat: number, lng: number) => Promise<void>;
  fetchPublicChargersForRoute: (polyline: string, distance?: number) => Promise<void>;
  isNavigating: boolean;
  setIsNavigating: React.Dispatch<React.SetStateAction<boolean>>;
  tripState: TripState;
  setTripState: React.Dispatch<React.SetStateAction<TripState>>;
  myVehicles: UserVehicle[];
  setMyVehicles: (v: UserVehicle[]) => void;
  addVehicle: (v: UserVehicle) => Promise<boolean>;
  removeVehicle: (id: string) => Promise<boolean>;
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
  const [tripState, setTripState] = useState<TripState>({
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

  // 1. Load Vehicles from Supabase on mount/login
  useEffect(() => {
    if (user) {
      fetchUserVehicles(user.id).then((vehicles) => {
        setMyVehicles(vehicles);
        // Set active vehicle from localStorage or first in list
        const savedActiveId = localStorage.getItem("plugpoint_active_vehicle_id");
        if (savedActiveId) {
          const active = vehicles.find((v) => v.id === savedActiveId);
          if (active) setActiveVehicle(active);
          else if (vehicles.length > 0) setActiveVehicle(vehicles[0]);
        } else if (vehicles.length > 0) {
          setActiveVehicle(vehicles[0]);
        }
      });
    } else {
      setMyVehicles([]);
      setActiveVehicle(null);
    }
  }, [user]);

  // 2. Persist active vehicle ID only
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
    const syncUser = async () => {
      if (firebaseUser) {
        // Try to get existing profile from Supabase first
        const dbProfile = await fetchProfile(firebaseUser.uid);
        
        const appUser: User = {
          id: firebaseUser.uid,
          name: dbProfile?.name || firebaseUser.displayName || "User",
          avatar: dbProfile?.avatar_url || firebaseUser.photoURL || "https://i.pravatar.cc/150?img=33",
          email: firebaseUser.email || dbProfile?.email || "",
          phone: dbProfile?.phone || firebaseUser.phoneNumber || "+91 99999 00000",
          joinedDate: dbProfile?.joined_date || "March 2026",
          chargersListed: dbProfile?.chargers_listed || 0,
          totalBookings: dbProfile?.total_bookings || 0,
          rating: Number(dbProfile?.rating) || 5.0,
          verified: !!firebaseUser.emailVerified,
          walletBalance: dbProfile ? Number(dbProfile.wallet_balance) : 0.00,
        };
        
        setUser(appUser);

        // Still call upsert to ensure sync (handles first-time setup or minor updates)
        if (!dbProfile) {
          await upsertProfile({
            id: firebaseUser.uid,
            name: appUser.name,
            avatar: appUser.avatar,
            email: appUser.email,
            phone: appUser.phone,
          });
        }

        // Fetch other user-specific data
        fetchBookings(firebaseUser.uid).then(setBookings);
        fetchUserVehicles(firebaseUser.uid).then(setMyVehicles);
      } else {
        setUser(null);
        setBookings([]);
        setMyVehicles([]);
        setActiveVehicle(null);
      }
    };

    syncUser();
  }, [firebaseUser]);

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
    const booking = bookings.find((b) => b.id === id);
    if (!booking) {
      throw new Error("Booking not found");
    }
    if (booking.status === "cancelled" || booking.status === "completed") {
      throw new Error("Booking is already cancelled or completed");
    }
    if (!firebaseUser) {
      throw new Error("User not authenticated");
    }

    const success = await updateWalletBalance(
      firebaseUser.uid,
      booking.totalCost,
      "credit",
      `Refund for cancelled booking: ${booking.chargerTitle}`,
      `refund-${id}`
    );

    if (!success) {
      throw new Error("Refund failed");
    }

    await updateBookingStatus(id, "cancelled");

    setUser((prev) =>
      prev ? { ...prev, walletBalance: prev.walletBalance + booking.totalCost } : null
    );
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b))
    );
  };

  const addReview = async (
    review: Pick<Review, "chargerId" | "bookingId" | "userId" | "userName" | "userAvatar" | "rating" | "comment">
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

  const updateProfile = async (updates: Partial<Pick<User, "name" | "phone" | "avatar">>) => {
    if (!firebaseUser || !user) return false;
    
    try {
      await upsertProfile({
        id: firebaseUser.uid,
        name: updates.name || user.name,
        avatar: updates.avatar || user.avatar,
        email: user.email,
        phone: updates.phone || user.phone,
      });
      setUser({ ...user, ...updates });
      return true;
    } catch (error) {
      console.error("updateProfile error:", error);
      return false;
    }
  };

  const addVehicle = async (vehicle: UserVehicle) => {
    if (!user) return false;
    const success = await upsertUserVehicle(user.id, vehicle);
    if (success) {
      setMyVehicles(prev => [...prev, vehicle]);
    }
    return success;
  };

  const removeVehicle = async (id: string) => {
    if (!user) return false;
    const success = await dbDeleteUserVehicle(id);
    if (success) {
      setMyVehicles(prev => prev.filter(v => v.id !== id));
      if (activeVehicle?.id === id) setActiveVehicle(null);
    }
    return success;
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

  const mergePublicChargers = (publicChargers: Charger[]) => {
    setChargers(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const newChargers = publicChargers.filter(c => !existingIds.has(c.id));
      return [...prev, ...newChargers];
    });
  };

  // This function fetches real-world EV chargers near a specific Latitude/Longitude.
  // We use the "Open Charge Map" (OCM) API to get this data.
  const fetchPublicChargers = async (lat: number, lng: number) => {
    try {
      const publicChargers = await fetchPublicChargersNear(lat, lng);
      mergePublicChargers(publicChargers);
    } catch (err) {
      console.error("Failed to fetch OCM data:", err);
    }
  };

  // This is a special version that searches for chargers along a driving path (Polyline).
  const fetchPublicChargersForRoute = async (polyline: string, distance: number = 5) => {
    try {
      const publicChargers = await fetchPublicChargersAlongRoute(polyline, distance);
      mergePublicChargers(publicChargers);
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
        updateProfile,
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
        addVehicle,
        removeVehicle,
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
