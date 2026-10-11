import { AIItinerary } from '../validation/schemas';

export interface SeededRouteTemplate {
  region: string;
  keywords: string[];
  destinations: {
    name: string;
    description: string;
    state_or_region: string;
    latitude: number;
    longitude: number;
    estimated_cost_ratio: number; // fraction of total budget
    estimated_travel_minutes: number;
    image_url: string;
    mission: {
      title: string;
      instructions: string;
      required_photo_count: number;
      points: number;
      explore_prompt: string;
      photo_prompt: string;
      note_prompt: string;
    };
  }[];
}

export const SEEDED_TEMPLATES: SeededRouteTemplate[] = [
  {
    region: 'Kerala Coast & Backwaters',
    keywords: ['kerala', 'kochi', 'varkala', 'trivandrum', 'cochin', 'south'],
    destinations: [
      {
        name: 'Varkala',
        description: 'A peaceful beach town with cliffs, vibrant cafes and amazing sunsets over the Arabian Sea.',
        state_or_region: 'Kerala',
        latitude: 8.7379,
        longitude: 76.7163,
        estimated_cost_ratio: 0.35,
        estimated_travel_minutes: 90,
        image_url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
        mission: {
          title: 'Cliff Explorer',
          instructions: 'Explore the beach & cliff, take 3 photos of the coastline, and write a note.',
          required_photo_count: 3,
          points: 100,
          explore_prompt: 'Explore the beach & cliff',
          photo_prompt: 'Take 3 photos',
          note_prompt: 'Add a short note',
        },
      },
      {
        name: 'Alleppey',
        description: 'Famous backwaters canal network, peaceful houseboats, and green paddy fields.',
        state_or_region: 'Kerala',
        latitude: 9.4981,
        longitude: 76.3388,
        estimated_cost_ratio: 0.35,
        estimated_travel_minutes: 120,
        image_url: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
        mission: {
          title: 'Backwater Navigator',
          instructions: 'Cruise the scenic backwaters canal network and capture traditional houseboats.',
          required_photo_count: 2,
          points: 150,
          explore_prompt: 'Cruise the canal network',
          photo_prompt: 'Take 2 photos of houseboats',
          note_prompt: 'Add a short note about the backwaters',
        },
      },
      {
        name: 'Kovalam',
        description: 'Iconic striped lighthouse overlooking crescent beaches and rocky coastal headlands.',
        state_or_region: 'Kerala',
        latitude: 8.4004,
        longitude: 76.9787,
        estimated_cost_ratio: 0.30,
        estimated_travel_minutes: 105,
        image_url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
        mission: {
          title: 'Lighthouse Summit',
          instructions: 'Climb to the lighthouse viewpoint and capture the panoramic curve of the beach.',
          required_photo_count: 2,
          points: 200,
          explore_prompt: 'Visit the red-and-white lighthouse',
          photo_prompt: 'Take 2 coastal viewpoint photos',
          note_prompt: 'Add a short note about the ocean breeze',
        },
      },
    ],
  },
  {
    region: 'Western Ghats Nature Trail',
    keywords: ['munnar', 'wayanad', 'hills', 'mountains', 'tea', 'nature'],
    destinations: [
      {
        name: 'Munnar Tea Highlands',
        description: 'Endless rolling emerald tea plantations, mist-covered hills and crisp mountain air.',
        state_or_region: 'Western Ghats',
        latitude: 10.0889,
        longitude: 77.0595,
        estimated_cost_ratio: 0.35,
        estimated_travel_minutes: 110,
        image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        mission: {
          title: 'Emerald Ridge Trek',
          instructions: 'Hike through the tea terrace pathway and photograph the morning fog rolling over the valley.',
          required_photo_count: 2,
          points: 120,
          explore_prompt: 'Explore the tea garden path',
          photo_prompt: 'Capture 2 photos of the morning mist',
          note_prompt: 'Describe the scent of the tea leaves',
        },
      },
      {
        name: 'Thekkady Spice Sanctuary',
        description: 'Dense rainforest canopy, spice plantations, and serene Periyar lakeside wildlife trail.',
        state_or_region: 'Western Ghats',
        latitude: 9.6031,
        longitude: 77.1615,
        estimated_cost_ratio: 0.35,
        estimated_travel_minutes: 100,
        image_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
        mission: {
          title: 'Spice Trail Discovery',
          instructions: 'Walk through an aromatic cardamon grove and photograph indigenous flora.',
          required_photo_count: 2,
          points: 150,
          explore_prompt: 'Walk the Periyar nature trail',
          photo_prompt: 'Take 2 photos of flora or spice trees',
          note_prompt: 'Note your favorite spice aroma',
        },
      },
      {
        name: 'Vagamon Pine Forest',
        description: 'Quiet pine forest trails and rolling green meadows high up in the Western Ghats.',
        state_or_region: 'Western Ghats',
        latitude: 9.6874,
        longitude: 76.9056,
        estimated_cost_ratio: 0.30,
        estimated_travel_minutes: 80,
        image_url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80',
        mission: {
          title: 'Pine Woods Solitude',
          instructions: 'Walk between towering conifers and capture sun rays filtering through pine needles.',
          required_photo_count: 2,
          points: 180,
          explore_prompt: 'Hike through the pine forest',
          photo_prompt: 'Capture 2 photos of canopy light',
          note_prompt: 'Reflect on the silence of the pines',
        },
      },
    ],
  },
  {
    region: 'Heritage & Palaces Route',
    keywords: ['delhi', 'jaipur', 'rajasthan', 'agra', 'culture', 'heritage'],
    destinations: [
      {
        name: 'Amber Fort Ridge',
        description: 'Magnificent sandstone fortress perched on a rugged hill with sweeping lake views.',
        state_or_region: 'Rajasthan',
        latitude: 26.9855,
        longitude: 75.8513,
        estimated_cost_ratio: 0.35,
        estimated_travel_minutes: 90,
        image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
        mission: {
          title: 'Fortress Gateway',
          instructions: 'Pass through the Sun Gate and photograph the intricate courtyards.',
          required_photo_count: 2,
          points: 130,
          explore_prompt: 'Explore the upper ramparts',
          photo_prompt: 'Take 2 photos of the arches',
          note_prompt: 'Note the royal architecture',
        },
      },
      {
        name: 'Hawa Mahal & Old Bazaar',
        description: 'The iconic honeycomb pink facade and labyrinthine spice and handicraft lanes.',
        state_or_region: 'Rajasthan',
        latitude: 26.9239,
        longitude: 75.8267,
        estimated_cost_ratio: 0.35,
        estimated_travel_minutes: 45,
        image_url: 'https://images.unsplash.com/photo-1609137144820-2210fec60341?auto=format&fit=crop&w=1200&q=80',
        mission: {
          title: 'Wind Palace View',
          instructions: 'Discover the facade from the rooftop perspective and browse the artisan street.',
          required_photo_count: 2,
          points: 160,
          explore_prompt: 'Walk through the pink city alleyways',
          photo_prompt: 'Take 2 photos of street life and facade',
          note_prompt: 'Write about the bustling bazaar energy',
        },
      },
      {
        name: 'Nahargarh Sunset Point',
        description: 'Hilltop fortifications overlooking the entire sprawling pink city during dusk.',
        state_or_region: 'Rajasthan',
        latitude: 26.9376,
        longitude: 75.8155,
        estimated_cost_ratio: 0.30,
        estimated_travel_minutes: 60,
        image_url: 'https://images.unsplash.com/photo-1598890777032-bde835ba27c2?auto=format&fit=crop&w=1200&q=80',
        mission: {
          title: 'Twilight Sentinel',
          instructions: 'Watch the sunset over the city walls and document the changing golden light.',
          required_photo_count: 2,
          points: 200,
          explore_prompt: 'Climb to the highest rampart',
          photo_prompt: 'Take 2 sunset panorama photos',
          note_prompt: 'Record your feelings as the city lights up',
        },
      },
    ],
  },
];

export function generateSeededItinerary(params: {
  startingLocation: string;
  budget: number;
  durationValue: number;
  durationUnit: 'hours' | 'days';
  transportMode: string;
  travelStyle: string;
  vibe?: string;
  climate?: string;
  adventureLevel?: string;
  extraPreferences?: string;
}): AIItinerary {
  const query = `${params.startingLocation} ${params.travelStyle} ${params.vibe || ''} ${params.climate || ''} ${params.extraPreferences || ''}`.toLowerCase();
  
  // Find matching template based on climate, vibe, or location keywords
  let template = SEEDED_TEMPLATES.find((t) =>
    t.keywords.some((k) => query.includes(k))
  );

  if (!template) {
    if (params.climate === 'mountain_mist' || params.vibe === 'adrenaline') {
      template = SEEDED_TEMPLATES[1]; // Western Ghats Nature & Misty Trail
    } else if (params.travelStyle === 'culture' || params.vibe === 'spiritual') {
      template = SEEDED_TEMPLATES[2]; // Heritage Palaces
    } else {
      template = SEEDED_TEMPLATES[0]; // Kerala Coast & Backwaters
    }
  }

  const totalBudget = params.budget;
  const destinations = template.destinations.map((dest, idx) => {
    const cost = Math.round(totalBudget * dest.estimated_cost_ratio);
    return {
      sequence_number: idx + 1,
      name: dest.name,
      description: dest.description,
      verified_place_id: `osm_seed_${dest.name.toLowerCase().replace(/\s+/g, '_')}`,
      latitude: dest.latitude,
      longitude: dest.longitude,
      estimated_cost: cost,
      estimated_travel_minutes: dest.estimated_travel_minutes,
      image_url: dest.image_url,
      state_or_region: dest.state_or_region,
      mission: {
        title: dest.mission.title,
        instructions: dest.mission.instructions,
        required_photo_count: dest.mission.required_photo_count,
        points: dest.mission.points,
        explore_prompt: dest.mission.explore_prompt,
        photo_prompt: dest.mission.photo_prompt,
        note_prompt: dest.mission.note_prompt,
      },
    };
  });

  const estimatedTotal = destinations.reduce((sum, d) => sum + d.estimated_cost, 0);

  return {
    trip_summary: `An unforgettable ${params.durationValue} ${params.durationUnit} adventure starting from ${params.startingLocation}, blending breathtaking nature, memorable missions, and curated local highlights.`,
    currency: 'INR',
    estimated_total_cost: estimatedTotal,
    destinations,
  };
}
