import type { Charger } from "../app/data/mock-data";

interface OpenChargeMapPoi {
  ID: number | string;
  OperatorInfo?: { Title?: string };
  AddressInfo?: {
    Title?: string;
    AddressLine1?: string;
    Town?: string;
    Latitude?: number;
    Longitude?: number;
    AccessComments?: string;
  };
  Connections?: Array<{
    ConnectionType?: { Title?: string };
    PowerKW?: number;
  }>;
  GeneralComments?: string;
}

const PUBLIC_OWNER_AVATAR =
  "https://images.unsplash.com/photo-1548625361-9d10e8c8942b?w=150&h=150&fit=crop";

const PUBLIC_CHARGER_IMAGE =
  "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1080&h=720&fit=crop";

function getOpenChargeMapApiKey() {
  return (import.meta as any).env.VITE_OCM_API_KEY || "";
}

function mapPublicCharger(poi: OpenChargeMapPoi, routeSpecific = false): Charger {
  return {
    id: `ocm-${poi.ID}`,
    ownerId: "ocm-network",
    ownerName: poi.OperatorInfo?.Title || "Public Station",
    ownerAvatar: PUBLIC_OWNER_AVATAR,
    ownerRating: 4.0,
    title: poi.AddressInfo?.Title || "Public EV Charger",
    description: poi.GeneralComments || "Public charging station provided via Open Charge Map.",
    image: PUBLIC_CHARGER_IMAGE,
    address: poi.AddressInfo?.AddressLine1 || "Public Location",
    city: poi.AddressInfo?.Town || "",
    lat: Number(poi.AddressInfo?.Latitude),
    lng: Number(poi.AddressInfo?.Longitude),
    connectorType: poi.Connections?.[0]?.ConnectionType?.Title || "Universal",
    power: poi.Connections?.[0]?.PowerKW || 7.2,
    pricePerHour: 100,
    pricePerKwh: 15,
    available: true,
    availableHours: "24/7",
    rating: 4.5,
    reviewCount: 0,
    amenities: routeSpecific ? ["Public Access", "On Route"] : ["Public Access"],
    instructions:
      poi.AddressInfo?.AccessComments ||
      poi.AddressInfo?.AddressLine1 ||
      "Public usage. Follow operator instructions on site.",
    verified: true,
  };
}

async function fetchOpenChargeMap(url: string, routeSpecific = false): Promise<Charger[]> {
  const response = await fetch(url);
  if (!response.ok) return [];

  const data = (await response.json()) as OpenChargeMapPoi[];
  return data
    .map((poi) => mapPublicCharger(poi, routeSpecific))
    .filter((charger) => Number.isFinite(charger.lat) && Number.isFinite(charger.lng));
}

export async function fetchPublicChargersNear(lat: number, lng: number): Promise<Charger[]> {
  const apiKey = getOpenChargeMapApiKey();
  const params = new URLSearchParams({
    output: "json",
    latitude: String(lat),
    longitude: String(lng),
    distance: "15",
    distanceunit: "KM",
    maxresults: "40",
  });
  if (apiKey) params.set("key", apiKey);

  return fetchOpenChargeMap(`https://api.openchargemap.io/v3/poi?${params.toString()}`);
}

export async function fetchPublicChargersAlongRoute(
  polyline: string,
  distance = 5
): Promise<Charger[]> {
  const apiKey = getOpenChargeMapApiKey();
  const params = new URLSearchParams({
    output: "json",
    polyline,
    distance: String(distance),
    distanceunit: "KM",
    maxresults: "500",
  });
  if (apiKey) params.set("key", apiKey);

  return fetchOpenChargeMap(`https://api.openchargemap.io/v3/poi?${params.toString()}`, true);
}
