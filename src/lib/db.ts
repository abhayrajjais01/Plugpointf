import { supabase } from "../config/supabase";
import type { Charger, Booking, Review } from "../app/data/mock-data";
import { format } from "date-fns";

// ─── Mappers (Supabase snake_case → app camelCase) ───────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCharger(row: any): Charger {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerAvatar: row.owner_avatar,
    ownerRating: Number(row.owner_rating),
    title: row.title,
    description: row.description,
    image: row.image_url,
    address: row.address,
    city: row.city,
    lat: Number(row.lat),
    lng: Number(row.lng),
    connectorType: row.connector_type,
    power: Number(row.power),
    pricePerHour: Number(row.price_per_hour),
    pricePerKwh: Number(row.price_per_kwh),
    available: row.available,
    availableHours: row.available_hours,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    amenities: row.amenities ?? [],
    instructions: row.instructions,
    verified: row.verified,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBooking(row: any): Booking {
  return {
    id: row.id,
    chargerId: row.charger_id,
    chargerTitle: row.charger_title,
    chargerImage: row.charger_image,
    chargerAddress: row.charger_address,
    hostName: row.host_name,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    totalCost: Number(row.total_cost),
    status: row.status,
    connectorType: row.connector_type,
    power: Number(row.power),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReview(row: any): Review {
  return {
    id: row.id,
    chargerId: row.charger_id,
    userId: row.user_id,
    userName: row.user_name,
    userAvatar: row.user_avatar,
    rating: row.rating,
    comment: row.comment,
    date: row.created_at ? format(new Date(row.created_at), "MMM d, yyyy") : "Recently",
    helpful: row.helpful ?? 0,
  };
}

// ─── Chargers ────────────────────────────────────────────────

export async function fetchChargers(): Promise<Charger[]> {
  const { data, error } = await supabase
    .from("chargers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("fetchChargers:", error.message); return []; }
  return (data ?? []).map(mapCharger);
}

export async function insertCharger(charger: Omit<Charger, "id">): Promise<Charger | null> {
  const { data, error } = await supabase
    .from("chargers")
    .insert({
      owner_id: charger.ownerId,
      owner_name: charger.ownerName,
      owner_avatar: charger.ownerAvatar,
      owner_rating: charger.ownerRating,
      title: charger.title,
      description: charger.description,
      image_url: charger.image,
      address: charger.address,
      city: charger.city,
      lat: charger.lat,
      lng: charger.lng,
      connector_type: charger.connectorType,
      power: charger.power,
      price_per_hour: charger.pricePerHour,
      price_per_kwh: charger.pricePerKwh,
      available: charger.available,
      available_hours: charger.availableHours,
      rating: charger.rating,
      review_count: charger.reviewCount,
      amenities: charger.amenities,
      instructions: charger.instructions,
      verified: charger.verified,
    })
    .select()
    .single();
  if (error) { console.error("insertCharger:", error.message); return null; }
  return mapCharger(data);
}

// ─── Bookings ─────────────────────────────────────────────────

export async function fetchBookings(userId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) { console.error("fetchBookings:", error.message); return []; }
  return (data ?? []).map(mapBooking);
}

export async function insertBooking(
  booking: Omit<Booking, "id">,
  userId: string
): Promise<Booking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      charger_id: booking.chargerId,
      charger_title: booking.chargerTitle,
      charger_image: booking.chargerImage,
      charger_address: booking.chargerAddress,
      host_name: booking.hostName,
      user_id: userId,
      date: booking.date,
      start_time: booking.startTime,
      end_time: booking.endTime,
      duration: booking.duration,
      total_cost: booking.totalCost,
      status: booking.status,
      connector_type: booking.connectorType,
      power: booking.power,
    })
    .select()
    .single();
  if (error) { console.error("insertBooking:", error.message); return null; }
  return mapBooking(data);
}

export async function updateBookingStatus(
  id: string,
  status: Booking["status"]
): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id);
  if (error) console.error("updateBookingStatus:", error.message);
}

// ─── Reviews ──────────────────────────────────────────────────

export async function fetchReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { console.error("fetchReviews:", error.message); return []; }
  return (data ?? []).map(mapReview);
}

export async function insertReview(
  review: Pick<Review, "chargerId" | "userId" | "userName" | "userAvatar" | "rating" | "comment">
): Promise<Review | null> {
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      charger_id: review.chargerId,
      user_id: review.userId,
      user_name: review.userName,
      user_avatar: review.userAvatar,
      rating: review.rating,
      comment: review.comment,
    })
    .select()
    .single();
  if (error) { console.error("insertReview:", error.message); return null; }
  // Recalculate charger average rating
  await recalcChargerRating(review.chargerId);
  return mapReview(data);
}

async function recalcChargerRating(chargerId: string) {
  const { data } = await supabase
    .from("reviews")
    .select("rating")
    .eq("charger_id", chargerId);
  if (!data || data.length === 0) return;
  const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
  await supabase
    .from("chargers")
    .update({ rating: Math.round(avg * 10) / 10, review_count: data.length })
    .eq("id", chargerId);
}

// ─── Profiles ─────────────────────────────────────────────────

export async function upsertProfile(p: {
  id: string; name: string; avatar: string; email: string; phone: string;
}) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: p.id,
      name: p.name,
      avatar_url: p.avatar,
      email: p.email,
      phone: p.phone,
      joined_date: format(new Date(), "MMMM yyyy"),
    },
    { onConflict: "id" }
  );
  if (error) console.error("upsertProfile:", error.message);
}

// ─── Storage: Charger Images ──────────────────────────────────

export async function uploadChargerImage(file: File, ownerId: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${ownerId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("charger-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) { console.error("uploadChargerImage:", error.message); return ""; }
  const { data } = supabase.storage.from("charger-images").getPublicUrl(path);
  return data.publicUrl;
}
