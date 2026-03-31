import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import {
  type User,
  type Charger,
  type Booking,
  type Review,
} from "../data/mock-data";
import { useFirebaseAuth } from "../../hooks/useFirebaseAuth";
import {
  fetchChargers,
  fetchBookings,
  fetchReviews,
  insertBooking,
  updateBookingStatus,
  insertReview as dbInsertReview,
  insertCharger,
  upsertProfile,
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
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  addBooking: (booking: Omit<Booking, "id">) => Promise<Booking | null>;
  cancelBooking: (id: string) => Promise<void>;
  addReview: (review: Pick<Review, "chargerId" | "userId" | "userName" | "userAvatar" | "rating" | "comment">) => Promise<void>;
  addCharger: (charger: Omit<Charger, "id">) => Promise<Charger | null>;
  refreshBookings: () => Promise<void>;
  fetchPublicChargers: (lat: number, lng: number) => Promise<void>;
  fetchPublicChargersForRoute: (polyline: string) => Promise<void>;
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

  // Load public data (chargers + reviews) on mount
  useEffect(() => {
    Promise.all([fetchChargers(), fetchReviews()]).then(([c, r]) => {
      setChargers(c);
      setReviews(r);
      setDataLoading(false);
    });
  }, []);

  // Sync Firebase user → local user + Supabase profile
  useEffect(() => {
    if (firebaseUser) {
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
      };
      setUser(appUser);
      // Sync to Supabase
      upsertProfile({
        id: firebaseUser.uid,
        name: appUser.name,
        avatar: appUser.avatar,
        email: appUser.email,
        phone: appUser.phone,
      });
      // Load their bookings
      fetchBookings(firebaseUser.uid).then(setBookings);
    } else {
      setUser(null);
      setBookings([]);
    }
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

  const refreshBookings = async () => {
    if (!firebaseUser) return;
    const fresh = await fetchBookings(firebaseUser.uid);
    setBookings(fresh);
  };

  const fetchPublicChargers = async (lat: number, lng: number) => {
    try {
      const apiKey = (import.meta as any).env.VITE_OCM_API_KEY || '';
      const url = `https://api.openchargemap.io/v3/poi?output=json&latitude=${lat}&longitude=${lng}&distance=15&distanceunit=KM&maxresults=40` + (apiKey ? `&key=${apiKey}` : '');
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      
      const publicChargers: Charger[] = data.map((poi: any) => ({
        id: `ocm-${poi.ID}`,
        ownerId: `ocm-network`,
        ownerName: poi.OperatorInfo?.Title || 'Public Station',
        ownerAvatar: "https://images.unsplash.com/photo-1548625361-9d10e8c8942b?w=150&h=150&fit=crop", // placeholder
        ownerRating: 4.0,
        title: poi.AddressInfo?.Title || 'Public EV Charger',
        description: poi.GeneralComments || "Public charging station provided via Open Charge Map. Pricing and availability may vary based on the network operator.",
        image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1080&h=720&fit=crop", // placeholder
        address: poi.AddressInfo?.AddressLine1 || 'Public Location',
        city: poi.AddressInfo?.Town || '',
        lat: poi.AddressInfo?.Latitude,
        lng: poi.AddressInfo?.Longitude,
        connectorType: poi.Connections?.[0]?.ConnectionType?.Title || 'Universal',
        power: poi.Connections?.[0]?.PowerKW || 7.2,
        pricePerHour: 100, // mock fallback
        pricePerKwh: 15,
        available: true,
        availableHours: "24/7",
        rating: 4.5,
        reviewCount: 0,
        amenities: ["Public Access"],
        instructions: poi.AddressInfo?.AccessComments || "Public usage. Follow operator instructions on site.",
        verified: true,
      }));

      // Merge and avoid duplicates
      setChargers(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newChargers = publicChargers.filter(c => !existingIds.has(c.id));
        return [...prev, ...newChargers];
      });
    } catch (err) {
      console.error("Failed to fetch OCM data:", err);
    }
  };

  const fetchPublicChargersForRoute = async (polyline: string) => {
    try {
      const apiKey = (import.meta as any).env.VITE_OCM_API_KEY || '';
      // distance is in km, adding a 5km buffer to the polyline route
      const url = `https://api.openchargemap.io/v3/poi?output=json&polyline=${encodeURIComponent(polyline)}&distance=5&distanceunit=KM&maxresults=100` + (apiKey ? `&key=${apiKey}` : '');
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      
      const publicChargers: Charger[] = data.map((poi: any) => ({
        id: `ocm-${poi.ID}`,
        ownerId: `ocm-network`,
        ownerName: poi.OperatorInfo?.Title || 'Public Station',
        ownerAvatar: "https://images.unsplash.com/photo-1548625361-9d10e8c8942b?w=150&h=150&fit=crop", // placeholder
        ownerRating: 4.0,
        title: poi.AddressInfo?.Title || 'Public EV Charger',
        description: poi.GeneralComments || "Public charging station provided via Open Charge Map. Pricing and availability may vary based on the network operator.",
        image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1080&h=720&fit=crop", // placeholder
        address: poi.AddressInfo?.AddressLine1 || 'Public Location',
        city: poi.AddressInfo?.Town || '',
        lat: poi.AddressInfo?.Latitude,
        lng: poi.AddressInfo?.Longitude,
        connectorType: poi.Connections?.[0]?.ConnectionType?.Title || 'Universal',
        power: poi.Connections?.[0]?.PowerKW || 7.2,
        pricePerHour: 100, // mock fallback
        pricePerKwh: 15,
        available: true,
        availableHours: "24/7",
        rating: 4.5,
        reviewCount: 0,
        amenities: ["Public Access", "On Route"],
        instructions: poi.AddressInfo?.AccessComments || "Public usage. Follow operator instructions on site.",
        verified: true,
      }));

      // Merge and avoid duplicates
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
        login,
        signup,
        loginWithGoogle,
        logout,
        addBooking,
        cancelBooking,
        addReview,
        addCharger,
        refreshBookings,
        fetchPublicChargers,
        fetchPublicChargersForRoute,
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
