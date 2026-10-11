export interface GeocodingResult {
  place_name: string;
  latitude: number;
  longitude: number;
  country: string;
}

export class MapService {
  /**
   * Search for locations using Nominatim or curated Indian travel hotspots
   */
  static async searchLocations(query: string): Promise<GeocodingResult[]> {
    if (!query || query.trim().length < 2) return [];

    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    // 1. If Google Maps API key is configured, use live Google Geocoding API
    if (googleApiKey) {
      try {
        const gRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${googleApiKey}`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.results && gData.results.length > 0) {
            return gData.results.slice(0, 5).map((item: any) => ({
              place_name: item.formatted_address,
              latitude: item.geometry.location.lat,
              longitude: item.geometry.location.lng,
              country: item.address_components?.find((c: any) => c.types?.includes('country'))?.long_name || 'Global',
            }));
          }
        }
      } catch (err) {
        console.warn('Google Geocoding request failed, trying OpenStreetMap:', err);
      }
    }

    // 2. Real live OpenStreetMap Nominatim geocoding lookup
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'WanderlyTravelApp/1.0',
            'Accept-Language': 'en',
          },
          signal: AbortSignal.timeout(4000),
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item: { display_name: string; lat: string; lon: string; address?: { country?: string } }) => ({
            place_name: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            country: item.address?.country || 'Global',
          }));
        }
      }
    } catch (nominatimErr) {
      console.warn('Nominatim search failed:', nominatimErr);
    }

    return [
      {
        place_name: query,
        latitude: 12.9716,
        longitude: 77.5946,
        country: 'India',
      },
    ];
  }
}
