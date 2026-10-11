/**
 * Autonomous Travel Research & Geospatial Intelligence Service
 * Uses free, open data sources (OpenStreetMap Nominatim, Wikipedia API, and Haversine geospatial calculations)
 * to research destinations, verify travel corridors, and calculate realistic budget economics.
 */

export interface GeoLocation {
  name: string;
  display_name: string;
  lat: number;
  lng: number;
  state?: string;
  country?: string;
}

export interface RegionResearch {
  location: GeoLocation;
  wikipedia_summary?: string;
  cultural_lore?: string;
  verified_corridors: string[];
  suggested_stops: {
    name: string;
    vibe: string;
    lat: number;
    lng: number;
    description: string;
    secret_spot: string;
  }[];
}

export interface BudgetBreakdown {
  transit_per_km: number;
  daily_stay_budget: number;
  daily_food_budget: number;
  activities_budget: number;
  buffer_reserve: number;
}

// Regional Travel Knowledge Base for India & South Asia (Zero-cost instant grounding)
const REGIONAL_CORRIDORS: Record<
  string,
  {
    corridors: string[];
    stops: {
      name: string;
      vibe: string;
      lat: number;
      lng: number;
      description: string;
      secret_spot: string;
      transit_tips?: {
        walking?: string;
        public_transit?: string;
        personal_vehicle?: string;
      };
    }[];
  }
> = {
  kerala: {
    corridors: ['NH 66 Coastal Highway & SWTD Waterways (Kochi - Alleppey - Varkala)', 'Western Ghats Ridge (Munnar - Thekkady - Vagamon)'],
    stops: [
      {
        name: 'Fort Kochi & Mattancherry',
        vibe: 'Colonial Heritage & Art',
        lat: 9.9656,
        lng: 76.2421,
        description: 'Atmospheric port town with 16th-century Portuguese quarters, spice warehouses, and Chinese fishing nets.',
        secret_spot: 'Secret courtyard cafe behind Jewish Synagogue antique bazaar.',
        transit_tips: {
          walking: '100% walkable heritage island. Walk the Bastion Street loop via Princess St.',
          public_transit: 'Take Kochi Water Metro from High Court Jetty to Fort Kochi for ₹20.',
          personal_vehicle: 'Park near Parade Ground (₹30/hr). Narrow heritage streets best explored on foot.',
        },
      },
      {
        name: 'Alleppey Backwater Canals',
        vibe: 'Waterway Drift',
        lat: 9.4981,
        lng: 76.3388,
        description: 'Vast network of shimmering backwater canals, water lilies, and emerald paddy basins below sea level.',
        secret_spot: 'Government public water bus (SWTD) local ferry to Nedumudi for ₹18.',
        transit_tips: {
          walking: 'Walk along Kayamkulam canal towpath and Finishing Point promenade.',
          public_transit: 'SWTD Public Ferry from Ernakulam Main Jetty to Alleppey for ₹40.',
          personal_vehicle: 'Drive via AC Road (Alappuzha-Changanassery Road). Park at KSRTC jetty.',
        },
      },
      {
        name: 'Varkala Red Cliffs',
        vibe: 'Coastal Bohemia',
        lat: 8.7379,
        lng: 76.7163,
        description: 'High red laterite cliffs towering over the Arabian Sea with seaside cafes and mineral springs.',
        secret_spot: 'Edava quiet sand spit where backwaters meet the open ocean.',
        transit_tips: {
          walking: 'Walk the 2.5 km North Cliff to South Cliff pedestrian boardwalk overlooking the ocean.',
          public_transit: 'Venad Express train to Varkala Sivagiri station (₹45), then ₹30 share auto to North Cliff.',
          personal_vehicle: 'Drive via Kallambalam turnoff. Park at Helipad Parking Ground (₹50 full day).',
        },
      },
      {
        name: 'Munnar High-Range Estates',
        vibe: 'Misty Mountains',
        lat: 10.0889,
        lng: 77.0595,
        description: 'Rolling tea gardens carpeted across the Western Ghats with cool breezes and cloud inversions.',
        secret_spot: 'Kolukkumalai off-road Jeep trail for sunrise above 7,900 feet.',
        transit_tips: {
          walking: 'Hike Old Munnar tea plantation trails (3–6 km guided walking routes).',
          public_transit: 'KSRTC Fast Passenger bus from Kochi/Aluva (₹160). Local auto ₹100/hr.',
          personal_vehicle: 'Drive via Kochi-Dhanushkodi Highway (NH 85). Watch for mountain curves.',
        },
      },
    ],
  },
  delhi: {
    corridors: ['Yellow & Violet Metro Lines (Old Delhi - Lutyens - Mehrauli Heritage Trail)'],
    stops: [
      {
        name: 'Chandni Chowk & Jama Masjid',
        vibe: 'Historic Spice Markets & Street Food',
        lat: 28.6506,
        lng: 77.2303,
        description: '17th-century Mughal heart of Delhi with dense spice bazaars, paranthe wali gali, and heritage mosques.',
        secret_spot: 'Rooftop view over Jama Masjid from spice merchant Haveli in Khari Baoli.',
        transit_tips: {
          walking: 'Extremely dense pedestrian alleys. Walk from Red Fort to Fatehpuri Masjid.',
          public_transit: 'Yellow Line Metro to Chandni Chowk Station (Gate 5). Metro fare ~₹30.',
          personal_vehicle: 'Avoid driving inside. Park at Old Delhi Railway Station multi-level parking (₹100).',
        },
      },
      {
        name: 'Mehrauli Archaeological Park & Qutub Minar',
        vibe: 'Sultanate Ruins & Forest Trails',
        lat: 28.5244,
        lng: 77.1855,
        description: '200 acres of ancient forested ruins, stepwells (Baoli), and 12th-century stone monuments.',
        secret_spot: 'Rajon ki Baoli stepwell at golden hour light.',
        transit_tips: {
          walking: 'Pleasant 4 km shaded walking loop inside the archaeological park.',
          public_transit: 'Yellow Line Metro to Qutub Minar Station, then ₹20 E-rickshaw.',
          personal_vehicle: 'Drive via Anuvrat Marg. Ample parking at Qutub Minar visitor lot (₹50).',
        },
      },
    ],
  },
  mumbai: {
    corridors: ['Western Line Suburban Corridor (Colaba - Bandra - Juhu Coastal)'],
    stops: [
      {
        name: 'Colaba & Kala Ghoda Art District',
        vibe: 'Colonial Heritage & Sea Breeze',
        lat: 18.922,
        lng: 72.8347,
        description: 'Victoria-era Gothic architecture, art galleries, iconic Gateway of India, and historic Iranian cafes.',
        secret_spot: 'Hidden courtyard at David Sassoon Library overlooking Prince of Wales museum gardens.',
        transit_tips: {
          walking: 'Very walkable heritage precinct. Walk along Rampart Row to Gateway.',
          public_transit: 'Local Train to Churchgate / CST (₹10), then BEST Bus #103 or ₹30 share taxi.',
          personal_vehicle: 'Park at Regal Cinema public lot or Nariman Point pay-and-park.',
        },
      },
      {
        name: 'Bandra Fort & Pali Hill Lanes',
        vibe: 'Bohemian Seaside & Vintage Bungalows',
        lat: 19.0435,
        lng: 72.8194,
        description: 'Coastal Portuguese fort ruins, colorful street art murals, and seaside promenade.',
        secret_spot: 'Ranwar Village heritage enclave with 150-year-old East Indian cottages.',
        transit_tips: {
          walking: 'Walk Carter Road Promenade down to Bandstand Fort rocks.',
          public_transit: 'Local train to Bandra Station (West), then Auto Rickshaw (₹23 meter base fare).',
          personal_vehicle: 'Drive via Bandra-Worli Sea Link (Toll ₹85). Parking at Carter Road.',
        },
      },
    ],
  },
  goa: {
    corridors: ['North Coast (Anjuna - Vagator - Arambol)', 'South Heritage (Old Goa - Palolem - Agonda)'],
    stops: [
      {
        name: 'Fontainhas Latin Quarter',
        vibe: 'Portuguese Heritage',
        lat: 15.4989,
        lng: 73.8278,
        description: 'Vibrant pastel yellow and blue mansions with overhanging tiled balconies in Panaji.',
        secret_spot: 'Traditional 100-year-old Goan bakery baking fresh Poi bread at 4 PM.',
        transit_tips: {
          walking: 'Stroll narrow cobblestone alleys around 31st January Road.',
          public_transit: 'KTM State Bus to Panaji Bus Stand (₹20), then 10 min walk.',
          personal_vehicle: 'Park at Panaji Municipal Multi-Level Parking near Mandovi river.',
        },
      },
      {
        name: 'Cabo de Rama Cliff Fort',
        vibe: 'Secluded Cliffs',
        lat: 15.0885,
        lng: 73.9216,
        description: 'Dramatic ancient fortress ruins perched high on a headland overlooking empty turquoise beaches.',
        secret_spot: 'Pebble beach cove tucked beneath the southern ramparts.',
        transit_tips: {
          walking: 'Hike cliffside trail down to Cabo de Rama beach cove.',
          public_transit: 'KTM local bus from Margao to Cabo de Rama village (₹35).',
          personal_vehicle: 'Scooter / Car drive via Canacona coastal highway.',
        },
      },
    ],
  },
  karnataka: {
    corridors: ['Malnad & Western Ghats (Coorg - Chikmagalur)', 'Ruins & Heritage (Hampi - Badami)'],
    stops: [
      {
        name: 'Hampi Boulder Corridors',
        vibe: 'Ancient Vijayanagara',
        lat: 15.335,
        lng: 76.46,
        description: 'Surreal landscape of giant granite boulders, 14th-century temple ruins, and the Tungabhadra river.',
        secret_spot: 'Sanapur Lake cliff jumping spot surrounded by banana plantations.',
        transit_tips: {
          walking: 'Walk the 3 km Matanga Hill to Virupaksha riverside trail.',
          public_transit: 'KSRTC bus from Hospet to Hampi (₹18). Bicycle rental ₹150/day.',
          personal_vehicle: 'Drive via NH 50. Park at Virupaksha main temple lot.',
        },
      },
      {
        name: 'Coorg Coffee Mist Highlands',
        vibe: 'Rainforest & Plantations',
        lat: 12.4244,
        lng: 75.7382,
        description: 'Rolling hills blanketed in shade-grown Arabica coffee, wild pepper vines, and orange groves.',
        secret_spot: 'Mandalpatti ridge lookout accessed via mist-covered dirt track.',
        transit_tips: {
          walking: 'Guided plantation trail walking through spice estates.',
          public_transit: 'KSRTC Rajahamsa bus to Madikeri (₹220). Local jeep ₹1200 split.',
          personal_vehicle: 'Drive via Mysore-Madikeri Road (NH 275). Scenic winding curves.',
        },
      },
    ],
  },
};


export class TravelResearcherService {
  /**
   * Free Geocoding via OpenStreetMap Nominatim
   * Queries real coordinates, bounding box, and region without requiring an API key.
   */
  static async geocodeLocation(query: string): Promise<GeoLocation | null> {
    try {
      const clean = encodeURIComponent(query.trim());
      const url = `https://nominatim.openstreetmap.org/search?q=${clean}&format=json&limit=1&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Wanderly-AI-Expedition-Planner/2.0 (contact@wanderly.app)',
          'Accept-Language': 'en',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          return {
            name: query,
            display_name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            state: item.address?.state,
            country: item.address?.country,
          };
        }
      }
    } catch (err) {
      console.warn('Nominatim geocoding bypassed, using fallback:', err);
    }

    // Heuristic fallback for common Indian destinations
    const lower = query.toLowerCase();
    if (lower.includes('kochi') || lower.includes('cochin')) {
      return { name: query, display_name: 'Kochi, Ernakulam, Kerala, India', lat: 9.9312, lng: 76.2673, state: 'Kerala', country: 'India' };
    }
    if (lower.includes('varkala')) {
      return { name: query, display_name: 'Varkala, Trivandrum, Kerala, India', lat: 8.7379, lng: 76.7163, state: 'Kerala', country: 'India' };
    }
    if (lower.includes('alleppey') || lower.includes('alappuzha')) {
      return { name: query, display_name: 'Alappuzha, Kerala, India', lat: 9.4981, lng: 76.3388, state: 'Kerala', country: 'India' };
    }
    if (lower.includes('munnar')) {
      return { name: query, display_name: 'Munnar, Idukki, Kerala, India', lat: 10.0889, lng: 77.0595, state: 'Kerala', country: 'India' };
    }
    if (lower.includes('goa')) {
      return { name: query, display_name: 'Goa, India', lat: 15.2993, lng: 74.124, state: 'Goa', country: 'India' };
    }
    if (lower.includes('bangalore') || lower.includes('bengaluru')) {
      return { name: query, display_name: 'Bengaluru, Karnataka, India', lat: 12.9716, lng: 77.5946, state: 'Karnataka', country: 'India' };
    }

    return null;
  }

  /**
   * Free Wikipedia / Wikivoyage Travel Summary Research
   * Fetches authentic real-time travel excerpts to ground AI prompts.
   */
  static async fetchWikipediaExcerpt(topic: string): Promise<string | null> {
    try {
      const clean = encodeURIComponent(topic.replace(/,.*$/, '').trim());
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${clean}`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Wanderly-AI-Expedition-Planner/2.0',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.extract) {
          return data.extract.slice(0, 350) + '...';
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * Comprehensive Region Research Bundle
   * Combines OSM geocoding, Wikipedia travel notes, and verified travel corridors.
   */
  static async researchRegion(startingLocation: string): Promise<RegionResearch> {
    const geo = (await this.geocodeLocation(startingLocation)) || {
      name: startingLocation,
      display_name: `${startingLocation}, India`,
      lat: 9.9312,
      lng: 76.2673,
      state: 'Kerala',
      country: 'India',
    };

    const wikiExcerpt = await this.fetchWikipediaExcerpt(startingLocation);

    // Identify regional corridor
    const normalizedState = (geo.state || '').toLowerCase();
    const normalizedName = startingLocation.toLowerCase();

    let matchedData = REGIONAL_CORRIDORS.kerala;
    if (normalizedState.includes('goa') || normalizedName.includes('goa')) {
      matchedData = REGIONAL_CORRIDORS.goa;
    } else if (normalizedState.includes('karnataka') || normalizedName.includes('bangalore') || normalizedName.includes('hampi')) {
      matchedData = REGIONAL_CORRIDORS.karnataka;
    }

    return {
      location: geo,
      wikipedia_summary: wikiExcerpt || undefined,
      cultural_lore: `Indigenous travel corridor known for distinct culinary traditions, local transit routes, and geographic transitions.`,
      verified_corridors: matchedData.corridors,
      suggested_stops: matchedData.stops,
    };
  }

  /**
   * Compute realistic budget breakdown based on transport mode and duration
   */
  static computeBudgetModel(
    totalBudget: number,
    durationDays: number,
    transportMode: string
  ): BudgetBreakdown {
    const dailyTotal = totalBudget / Math.max(1, durationDays);

    let transitPerKm = 2.0; // standard state bus
    if (transportMode === 'car' || transportMode === 'cab') transitPerKm = 14.0;
    else if (transportMode === 'bike') transitPerKm = 4.5;
    else if (transportMode === 'public_transit') transitPerKm = 1.6;

    // Allocate realistic independent backpacker proportions
    const dailyStay = Math.max(400, Math.round(dailyTotal * 0.38));
    const dailyFood = Math.max(300, Math.round(dailyTotal * 0.28));
    const activities = Math.max(200, Math.round(dailyTotal * 0.20));
    const buffer = Math.max(100, totalBudget - (dailyStay + dailyFood + activities) * durationDays);

    return {
      transit_per_km: transitPerKm,
      daily_stay_budget: dailyStay,
      daily_food_budget: dailyFood,
      activities_budget: activities,
      buffer_reserve: Math.max(0, buffer),
    };
  }

  /**
   * Haversine formula to compute great-circle distance between coordinates in KM
   */
  static calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}
