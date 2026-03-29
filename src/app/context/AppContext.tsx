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
