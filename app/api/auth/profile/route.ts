import { NextRequest, NextResponse } from 'next/server';
import { demoStore } from '@/lib/storage/demo-store';
import { isSupabaseServerConfigured, createServerClient } from '@/lib/supabase/server';
import { Profile } from '@/types/database';

// Public traveler directory explorers
const PUBLIC_EXPLORERS = [
  {
    id: 'exp_aria_01',
    username: 'aria_nomad',
    display_name: 'Aria Vance',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=aria_nomad',
    title: 'High-Altitude Ridge Seeker',
    level: 6,
    trips_count: 5,
    stops_count: 12,
    vibes: ['Mountain Mist', 'Wild Treks'],
    bio: 'Backpacking through tea gardens and misty crests.',
  },
  {
    id: 'exp_kaelen_02',
    username: 'kaelen_drift',
    display_name: 'Kaelen Croft',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=kaelen_drift',
    title: 'Coastal Cliff Vagabond',
    level: 4,
    trips_count: 3,
    stops_count: 8,
    vibes: ['Scenic Coast', 'Sunset Cliffs'],
    bio: 'Chasing sunset cliffs and hidden saltwater lagoons.',
  },
  {
    id: 'exp_meera_03',
    username: 'meera_wanders',
    display_name: 'Meera Sen',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=meera_wanders',
    title: 'Monsoon Wayfinder',
    level: 7,
    trips_count: 6,
    stops_count: 17,
    vibes: ['Lush Forest', 'Hidden Gems'],
    bio: 'Documenting forgotten forest corridors and river bends.',
  },
  {
    id: 'exp_tara_04',
    username: 'tara_routes',
    display_name: 'Tara Joshi',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=tara_routes',
    title: 'Canal & Backwater Drifter',
    level: 5,
    trips_count: 4,
    stops_count: 10,
    vibes: ['Chill & Serene', 'Foodie Trails'],
    bio: 'Exploring silent waterways and local street spices.',
  },
  {
    id: 'exp_julian_05',
    username: 'julian_astro',
    display_name: 'Julian Ray',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=julian_astro',
    title: 'Nocturnal Sky Scout',
    level: 3,
    trips_count: 2,
    stops_count: 6,
    vibes: ['Mountain Mist', 'Heritage & Culture'],
    bio: 'Stargazing at remote high-elevation passes.',
  },
];

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-wanderly-user-id') || req.cookies.get('wanderly_user_id')?.value;
    let profile: Profile | null = null;

    if (userId) {
      if (isSupabaseServerConfigured()) {
        const supabase = createServerClient();
        if (supabase) {
          const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
          if (data) profile = data;
        }
      }
      if (!profile) {
        profile = demoStore.getProfile(userId);
      }
    }

    return NextResponse.json({
      profile,
      directory: PUBLIC_EXPLORERS,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching profile';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get('x-wanderly-user-id') || req.cookies.get('wanderly_user_id')?.value;
    const body = await req.json();
    const newUsername = (body.username || '').trim();

    if (!newUsername || newUsername.length < 2 || newUsername.length > 28) {
      return NextResponse.json(
        { error: 'Username must be between 2 and 28 characters.' },
        { status: 400 }
      );
    }

    let updatedProfile: Profile | null = null;

    if (userId) {
      if (isSupabaseServerConfigured()) {
        const supabase = createServerClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('profiles')
            .update({
              username: newUsername,
              display_name: newUsername,
              avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${newUsername}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
            .select()
            .single();

          if (!error && data) {
            updatedProfile = data;
          }
        }
      }

      const existingDemo = demoStore.getProfile(userId);
      if (existingDemo || !updatedProfile) {
        updatedProfile = demoStore.upsertProfile({
          id: userId,
          username: newUsername,
          display_name: newUsername,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${newUsername}`,
          created_at: existingDemo?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } else {
      // Create guest profile if no ID exists
      const guestId = `guest_${Date.now()}`;
      updatedProfile = demoStore.upsertProfile({
        id: guestId,
        username: newUsername,
        display_name: newUsername,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${newUsername}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update username';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
