export interface Coordinates {
  lat: number;
  lng: number;
  label?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name?: string;
}

export async function geocodeAddress(address: string, city: string): Promise<Coordinates> {
  const query = [address, city, "India"].filter(Boolean).join(", ");
  const params = new URLSearchParams({
    format: "jsonv2",
    q: query,
    limit: "1",
    addressdetails: "1",
    countrycodes: "in",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      "Accept-Language": "en",
    },
  });

  if (!response.ok) {
    throw new Error("Could not verify this address right now. Please try again.");
  }

  const results = (await response.json()) as NominatimResult[];
  const bestMatch = results[0];

  if (!bestMatch) {
    throw new Error("We could not find that address on the map. Please add a more specific street or landmark.");
  }

  const lat = Number(bestMatch.lat);
  const lng = Number(bestMatch.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("The map returned an invalid location for this address.");
  }

  return {
    lat,
    lng,
    label: bestMatch.display_name,
  };
}
