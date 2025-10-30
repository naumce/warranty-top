// Haversine formula to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Mock store locations database (in production, this would come from an API)
// Format: store chain name -> array of locations
export const STORE_LOCATIONS: Record<string, Array<{
  name: string;
  address: string;
  city: string;
  lat: number;
  lon: number;
  phone?: string;
}>> = {
  "neptun": [
    { name: "Neptun Bucharest Mall", address: "Calea Vitan 55-59", city: "Bucharest", lat: 44.4268, lon: 26.1025, phone: "+40 21 209 0909" },
    { name: "Neptun AFI Cotroceni", address: "Bd. Vasile Milea 4", city: "Bucharest", lat: 44.4325, lon: 26.0534, phone: "+40 21 209 0910" },
    { name: "Neptun Baneasa Shopping City", address: "Șoseaua București-Ploiești 42D", city: "Bucharest", lat: 44.5048, lon: 26.0826, phone: "+40 21 209 0911" },
  ],
  "emag": [
    { name: "eMAG Showroom Bucharest", address: "Bd. Dimitrie Pompeiu 9-9A", city: "Bucharest", lat: 44.4848, lon: 26.1119, phone: "+40 21 9090" },
    { name: "eMAG Marketplace Brașov", address: "Str. Zizinului 119", city: "Brașov", lat: 45.6427, lon: 25.5887, phone: "+40 268 514 514" },
  ],
  "mediaGalaxy": [
    { name: "Media Galaxy Bucharest Mall", address: "Calea Vitan 55-59", city: "Bucharest", lat: 44.4268, lon: 26.1025, phone: "+40 21 209 0800" },
    { name: "Media Galaxy Sun Plaza", address: "Calea Văcărești 391", city: "Bucharest", lat: 44.3969, lon: 26.1211, phone: "+40 21 209 0801" },
  ],
  "altex": [
    { name: "Altex Bucharest Mega Mall", address: "Bd. Pierre de Coubertin 3-5", city: "Bucharest", lat: 44.4267, lon: 26.1523, phone: "+40 21 316 0000" },
    { name: "Altex Cluj-Napoca", address: "Strada Avram Iancu 492-500", city: "Cluj-Napoca", lat: 46.7712, lon: 23.6236, phone: "+40 264 444 000" },
  ],
  "bestbuy": [
    { name: "Best Buy Manhattan", address: "529 5th Ave", city: "New York", lat: 40.7549, lon: -73.9840, phone: "+1 212-366-1373" },
    { name: "Best Buy Times Square", address: "1280 Lexington Ave", city: "New York", lat: 40.7809, lon: -73.9550, phone: "+1 646-429-8067" },
  ],
  "gamestop": [
    { name: "GameStop Bucharest", address: "Bulevardul Regina Elisabeta 5", city: "Bucharest", lat: 44.4361, lon: 26.0972, phone: "+40 31 229 0000" },
  ],
  "walmart": [
    { name: "Walmart Supercenter", address: "1500 Market St", city: "San Francisco", lat: 37.7749, lon: -122.4194, phone: "+1 415-555-0100" },
  ],
};

export interface NearestStore {
  name: string;
  address: string;
  city: string;
  phone?: string;
  distance: number; // in km
  googleMapsUrl: string;
}

export function findNearestStores(
  storeName: string,
  userLat: number,
  userLon: number,
  limit: number = 3
): NearestStore[] {
  // Normalize store name for matching
  const normalizedStoreName = storeName.toLowerCase().trim();
  
  // Find matching store chain
  let storeChain: string | undefined;
  
  for (const chainName of Object.keys(STORE_LOCATIONS)) {
    if (normalizedStoreName.includes(chainName.toLowerCase())) {
      storeChain = chainName;
      break;
    }
  }
  
  if (!storeChain || !STORE_LOCATIONS[storeChain]) {
    return [];
  }
  
  // Calculate distances and sort
  const storesWithDistance = STORE_LOCATIONS[storeChain].map((store) => {
    const distance = calculateDistance(userLat, userLon, store.lat, store.lon);
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lon}`;
    
    return {
      ...store,
      distance,
      googleMapsUrl,
    };
  });
  
  // Sort by distance and return top N
  return storesWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m away`;
  }
  return `${km.toFixed(1)}km away`;
}

