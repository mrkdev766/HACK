import { NextRequest, NextResponse } from 'next/server';
import { demoStore } from '@/lib/storage/demo-store';
import { isSupabaseServerConfigured, createServerClient } from '@/lib/supabase/server';

const SEEDED_COMMUNITY_QUESTS = [
  {
    id: 'quest_malabar_01',
    user_id: 'exp_aria_01',
    starting_location_name: 'Kochi to Varkala Corridor',
    public_title: 'Unmapped Malabar Drift: Canals & Red Cliffs',
    public_description: 'Off-grid 3-day route from historic spice wharfs down to the ocean cliffs. Includes authentic ₹18 SWTD local water buses and hidden tea courtyards.',
    budget_amount: 5500,
    currency: 'INR',
    duration_value: 3,
    duration_unit: 'days',
    transport_mode: 'public_transit',
    vibe: '🌴 Coastal Mist',
    clones_count: 48,
    total_points: 450,
    author: {
      username: 'aria_nomad',
      display_name: 'Aria Vance',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=aria_nomad',
    },
    destinations: [
      {
        id: 'cdest_1',
        name: 'Fort Kochi Spice Wharfs',
        actual_spend: 1200,
        estimated_cost: 1500,
        image_url: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80',
        description: 'Explore the 16th-century colonial spice trading wharfs and cantilever nets.',
      },
      {
        id: 'cdest_2',
        name: 'Punnamada Canoe Village',
        actual_spend: 1800,
        estimated_cost: 2000,
        image_url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
        description: 'Silent canal paddling beneath coconut palms with fresh toddy and tapioca.',
      },
      {
        id: 'cdest_3',
        name: 'North Cliff Mineral Springs',
        actual_spend: 2100,
        estimated_cost: 2000,
        image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        description: 'Red laterite cliff walk with natural freshwater showers falling to the sea.',
      },
    ],
    preview_photos: [
      'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
    ],
  },
  {
    id: 'quest_ghats_02',
    user_id: 'exp_meera_03',
    starting_location_name: 'Western Ghats Ridge',
    public_title: 'Misty Tea Highlands & Periyar River Canopy',
    public_description: 'Tested backpacker trail through 7,900ft Kolukkumalai sunrise peaks and dense cardamom rainforest groves. Real homestay expenses included.',
    budget_amount: 6200,
    currency: 'INR',
    duration_value: 3,
    duration_unit: 'days',
    transport_mode: 'public_transit',
    vibe: '⛰️ Mountain Ridge',
    clones_count: 32,
    total_points: 400,
    author: {
      username: 'meera_wanders',
      display_name: 'Meera Sen',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=meera_wanders',
    },
    destinations: [
      {
        id: 'cdest_4',
        name: 'Kolukkumalai High Ridge',
        actual_spend: 2400,
        estimated_cost: 2500,
        image_url: 'https://images.unsplash.com/photo-1571687949921-1306bfb24b72?auto=format&fit=crop&w=800&q=80',
        description: 'Sunrise above cloud valleys at the highest tea estate in the world.',
      },
      {
        id: 'cdest_5',
        name: 'Thekkady Rainforest Trails',
        actual_spend: 1900,
        estimated_cost: 2000,
        image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        description: 'Wild bamboo raft exploration on Periyar lake with wild elephant herds.',
      },
      {
        id: 'cdest_6',
        name: 'Vagamon Pine Canyon',
        actual_spend: 1500,
        estimated_cost: 1700,
        image_url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80',
        description: 'Silent conifer woods and green rolling meadows high in the mountains.',
      },
    ],
    preview_photos: [
      'https://images.unsplash.com/photo-1571687949921-1306bfb24b72?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    ],
  },
  {
    id: 'quest_hampi_03',
    user_id: 'exp_julian_05',
    starting_location_name: 'Tungabhadra Boulder Basin',
    public_title: 'Forgotten Vijayanagara & Boulder Sunsets',
    public_description: 'An ancient boulder labyrinth explored by rented moped. Coracle crossings across the river, hippie island ruins, and star-lit temple ramparts.',
    budget_amount: 4800,
    currency: 'INR',
    duration_value: 2,
    duration_unit: 'days',
    transport_mode: 'bike',
    vibe: '🏛️ Ancient Ruins',
    clones_count: 57,
    total_points: 350,
    author: {
      username: 'julian_astro',
      display_name: 'Julian Ray',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=julian_astro',
    },
    destinations: [
      {
        id: 'cdest_7',
        name: 'Matanga Hill Sunrise Peak',
        actual_spend: 1200,
        estimated_cost: 1400,
        image_url: 'https://images.unsplash.com/photo-1600100397608-f010f4439c2d?auto=format&fit=crop&w=800&q=80',
        description: 'Dawn climb over 500 stone stairs for a 360-degree panorama of Hampi ruins.',
      },
      {
        id: 'cdest_8',
        name: 'Sanapur Lake Boulders',
        actual_spend: 1600,
        estimated_cost: 1800,
        image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
        description: 'Clear reservoir ringed by red granite stones with coracle boat floats.',
      },
    ],
    preview_photos: [
      'https://images.unsplash.com/photo-1600100397608-f010f4439c2d?auto=format&fit=crop&w=400&q=80',
    ],
  },
];

export async function GET(req: NextRequest) {
  try {
    const userPublished = demoStore.getPublicTrips();

    // Deduplicate and combine user published trips with seeded community quests
    const allQuests = [...userPublished, ...SEEDED_COMMUNITY_QUESTS];

    return NextResponse.json({
      success: true,
      quests: allQuests,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load discovery quests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-wanderly-user-id') || 'guest_user';
    const body = await req.json();
    const { action, questId } = body;

    if (action === 'clone' && questId) {
      // 1. Check if it is a seeded quest
      const seeded = SEEDED_COMMUNITY_QUESTS.find((q) => q.id === questId);
      if (seeded) {
        seeded.clones_count += 1;

        // Create new trip in demoStore
        const newTripId = `trip-cloned-${Date.now()}`;
        const newTrip = {
          id: newTripId,
          user_id: userId,
          starting_location_name: seeded.starting_location_name,
          starting_location_latitude: 9.9312,
          starting_location_longitude: 76.2673,
          budget_amount: seeded.budget_amount,
          currency: seeded.currency,
          duration_value: seeded.duration_value,
          duration_unit: 'days' as const,
          transport_mode: seeded.transport_mode as any,
          travel_style: 'nature' as const,
          estimated_total_cost: seeded.budget_amount,
          total_points: 0,
          status: 'active' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const newDests = seeded.destinations.map((d, idx) => ({
          id: `dest-${newTripId}-${idx}`,
          trip_id: newTripId,
          sequence_number: idx + 1,
          name: d.name,
          description: d.description,
          verified_place_id: `cloned_${idx}`,
          latitude: 9.9312 + idx * 0.2,
          longitude: 76.2673 + idx * 0.2,
          estimated_cost: d.actual_spend || d.estimated_cost,
          actual_spend: null,
          estimated_travel_minutes: 90,
          image_url: d.image_url,
          status: idx === 0 ? ('unlocked' as const) : ('locked' as const),
          created_at: new Date().toISOString(),
        }));

        const newMissions = newDests.map((nd, idx) => ({
          id: `mission-${nd.id}`,
          destination_id: nd.id,
          title: `${nd.name} Quest`,
          instructions: `Explore ${nd.name} and document your field impressions.`,
          required_photo_count: 2,
          points: 100 + idx * 50,
          requirements_json: {
            explore_prompt: `Visit ${nd.name}`,
            photo_prompt: 'Capture 2 photos of this location',
            note_prompt: 'Reflect on this spot',
          },
          created_at: new Date().toISOString(),
        }));

        demoStore.saveTrip(newTrip, newDests, newMissions);

        return NextResponse.json({
          success: true,
          trip_id: newTripId,
          message: 'Adventure cloned and started successfully!',
        });
      }

      // 2. Clone from existing user trip in demoStore
      const cloned = demoStore.cloneTrip(questId, userId);
      if (cloned) {
        return NextResponse.json({
          success: true,
          trip_id: cloned.trip.id,
          message: 'Community quest forked and activated!',
        });
      }
    }

    return NextResponse.json({ error: 'Invalid discovery request' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to clone quest' }, { status: 500 });
  }
}
