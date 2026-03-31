export function encodePolyline(coordinates: [number, number][], precision = 5) {
  const factor = Math.pow(10, precision);
  let lastLat = 0;
  let lastLng = 0;
  let result = '';

  for (const coord of coordinates) {
      const lat = coord[1]; // GeoJSON is [lng, lat]
      const lng = coord[0];
      
      const latE5 = Math.round(lat * factor);
      const lngE5 = Math.round(lng * factor);

      const dLat = latE5 - lastLat;
      const dLng = lngE5 - lastLng;

      lastLat = latE5;
      lastLng = lngE5;

      result += encodeValue(dLat) + encodeValue(dLng);
  }
  return result;
}

function encodeValue(value: number) {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let result = '';
  while (v >= 0x20) {
      result += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
  }
  result += String.fromCharCode(v + 63);
  return result;
}
