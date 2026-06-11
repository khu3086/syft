// Lightweight, offline geocoder for the signup pipeline — maps a city string to
// coordinates so distance filtering works for new users. A curated gazetteer of
// major Indian cities (no API key, deterministic, fast). Unknown inputs fall back
// to the national default. Swap in a real geocoding API later behind this seam.

export interface Coords {
  lat: number;
  lng: number;
}

// Default: Bengaluru (matches the seed pool's centre).
export const DEFAULT_COORDS: Coords = { lat: 12.9716, lng: 77.5946 };

const GAZETTEER: Record<string, Coords> = {
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  bombay: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.209 },
  "new delhi": { lat: 28.6139, lng: 77.209 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  noida: { lat: 28.5355, lng: 77.391 },
  pune: { lat: 18.5204, lng: 73.8567 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  madras: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  calcutta: { lat: 22.5726, lng: 88.3639 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  surat: { lat: 21.1702, lng: 72.8311 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  indore: { lat: 22.7196, lng: 75.8577 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  patna: { lat: 25.5941, lng: 85.1376 },
  vadodara: { lat: 22.3072, lng: 73.1812 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  cochin: { lat: 9.9312, lng: 76.2673 },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  mangaluru: { lat: 12.9141, lng: 74.856 },
  mangalore: { lat: 12.9141, lng: 74.856 },
  goa: { lat: 15.2993, lng: 74.124 },
  panaji: { lat: 15.4909, lng: 73.8278 },
  guwahati: { lat: 26.1445, lng: 91.7362 },
};

/** Resolve a free-text city ("Indiranagar, Bengaluru, Karnataka") to coordinates. */
export function geocodeCity(input?: string): Coords {
  if (!input) return DEFAULT_COORDS;
  const norm = input.trim().toLowerCase();

  // Try each comma-separated part (locality → city → state), most specific first.
  const parts = norm.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of [...parts, norm]) {
    if (GAZETTEER[part]) return GAZETTEER[part];
  }
  // Substring match — handles "south bengaluru", "navi mumbai", etc.
  for (const [city, coords] of Object.entries(GAZETTEER)) {
    if (norm.includes(city)) return coords;
  }
  return DEFAULT_COORDS;
}
