/**
 * --- CORE TYPE DEFINITIONS ---
 * These interfaces define the shape of every major data entity in PlugPoint.
 * They are the single source of truth for all components, services, and database mappers.
 */

/** Blueprint for a PlugPoint user / host profile. */
export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  joinedDate: string;
  chargersListed: number;
  totalBookings: number;
  rating: number;
  verified: boolean;
  walletBalance: number;
}

/** A charging station — could be a private home charger or a public station. */
export interface Charger {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  ownerRating: number;
  title: string;
  description: string;
  image: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  connectorType: string;
  power: number;
  pricePerHour: number;
  pricePerKwh: number;
  available: boolean;
  availableHours: string;
  rating: number;
  reviewCount: number;
  amenities: string[];
  instructions: string;
  verified: boolean;
}

/** A booking/reservation for a charging session. */
export interface Booking {
  id: string;
  chargerId: string;
  chargerTitle: string;
  chargerImage: string;
  chargerAddress: string;
  hostName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalCost: number;
  status: "upcoming" | "active" | "completed" | "cancelled";
  connectorType: string;
  power: number;
}

/** A user review left on a charger after a completed session. */
export interface Review {
  id: string;
  chargerId: string;
  bookingId: string | null;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

/** State for the trip planner / route calculator. */
export interface TripState {
  origin: string;
  destination: string;
  isLoading: boolean;
  routeData: GeoJSON.LineString | null;
  distance: number | null;
  duration: number | null;
  error: string | null;
}
