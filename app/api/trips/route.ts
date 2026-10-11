import { NextRequest, NextResponse } from 'next/server';
import { PlanTripSchema } from '@/lib/validation/schemas';
import { TripPlannerService } from '@/lib/ai/itinerary-planner';
import { demoStore } from '@/lib/storage/demo-store';
import { isSupabaseServerConfigured, createServerClient } from '@/lib/supabase/server';
import { Destination, Mission, Trip, Profile } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    let userId: string =
      req.headers.get('x-wanderly-user-id') ||
      req.cookies.get('wanderly_user_id')?.value ||
      crypto.randomUUID();
    let provisionedProfile: Profile | null = null;

    if (isSupabaseServerConfigured()) {
      const supabase = createServerClient();
      if (supabase) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '');
        if (!userId || !isUuid) {
          const { data: authData } = await supabase.auth.signInAnonymously();
          userId = authData?.user?.id || crypto.randomUUID();
        }

        const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', userId).single();
        if (!existingProfile) {
          const guestUsername = `wanderer_${Math.floor(1000 + Math.random() * 9000)}`;
          provisionedProfile = {
            id: userId,
            username: guestUsername,
            display_name: guestUsername,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestUsername}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await supabase.from('profiles').upsert(provisionedProfile);
        }
      }
    } else {
      if (!userId) {
        const guestUsername = `wanderer_${Math.floor(1000 + Math.random() * 9000)}`;
        const guestId = crypto.randomUUID();
        userId = guestId;

        provisionedProfile = {
          id: guestId,
          username: guestUsername,
          display_name: guestUsername,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestUsername}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        demoStore.upsertProfile(provisionedProfile);
      }
    }

    const body = await req.json();
    const parsed = PlanTripSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid trip parameters' },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // 1. Generate itinerary through AI Planner Service
    const plannerResult = await TripPlannerService.planTrip(input);
    const { itinerary, mode, notes } = plannerResult;

    // 2. Prepare database entities
    const tripId = crypto.randomUUID();
    const newTrip: Trip = {
      id: tripId,
      user_id: userId,
      starting_location_name: input.starting_location,
      starting_location_latitude: itinerary.destinations[0]?.latitude || null,
      starting_location_longitude: itinerary.destinations[0]?.longitude || null,
      budget_amount: input.budget_amount,
      currency: input.currency,
      duration_value: input.duration_value,
      duration_unit: input.duration_unit,
      transport_mode: input.transport_mode,
      travel_style: input.travel_style,
      estimated_total_cost: itinerary.estimated_total_cost,
      total_points: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newDestinations: Destination[] = [];
    const newMissions: Mission[] = [];

    itinerary.destinations.forEach((d, idx) => {
      const destId = crypto.randomUUID();
      const missionId = crypto.randomUUID();

      // Only the first destination is unlocked initially!
      const status = idx === 0 ? 'unlocked' : 'locked';

      newDestinations.push({
        id: destId,
        trip_id: tripId,
        sequence_number: d.sequence_number,
        name: d.name,
        description: d.description,
        verified_place_id: d.verified_place_id || null,
        latitude: d.latitude || null,
        longitude: d.longitude || null,
        estimated_cost: d.estimated_cost,
        estimated_travel_minutes: d.estimated_travel_minutes,
        image_url: d.image_url,
        status,
        created_at: new Date().toISOString(),
      });

      newMissions.push({
        id: missionId,
        destination_id: destId,
        title: d.mission.title,
        instructions: d.mission.instructions,
        required_photo_count: d.mission.required_photo_count,
        points: d.mission.points,
        requirements_json: {
          explore_prompt: d.mission.explore_prompt,
          photo_prompt: d.mission.photo_prompt,
          note_prompt: d.mission.note_prompt,
        },
        created_at: new Date().toISOString(),
      });
    });

    // 3. Persist transactionally
    if (isSupabaseServerConfigured()) {
      const supabase = createServerClient();
      if (supabase) {
        const { error: tripError } = await supabase.from('trips').insert(newTrip);
        if (tripError) {
          console.error('[Supabase] Trip insert error:', tripError);
          throw new Error(`Failed to save trip in Supabase: ${tripError.message}`);
        }
        const { error: destError } = await supabase.from('destinations').insert(newDestinations);
        if (destError) {
          console.error('[Supabase] Destinations insert error:', destError);
        }
        const { error: missError } = await supabase.from('missions').insert(newMissions);
        if (missError) {
          console.error('[Supabase] Missions insert error:', missError);
        }
      }
    } else {
      demoStore.saveTrip(newTrip, newDestinations, newMissions);
    }

    const response = NextResponse.json({
      success: true,
      trip_id: tripId,
      user_id: userId,
      profile: provisionedProfile,
      mode,
      notes,
      starting_destination: {
        id: newDestinations[0].id,
        name: newDestinations[0].name,
        sequence_number: 1,
      },
    });

    response.cookies.set('wanderly_user_id', userId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      sameSite: 'lax',
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create trip';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-wanderly-user-id') || req.cookies.get('wanderly_user_id')?.value;
    if (!userId) {
      return NextResponse.json({ success: true, trips: [] });
    }

    if (isSupabaseServerConfigured()) {
      const supabase = createServerClient();
      if (supabase) {
        const { data: trips } = await supabase
          .from('trips')
          .select('*, destinations(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        const enriched = (trips || []).map((t: any) => {
          const dests = t.destinations || [];
          const completedCount = dests.filter((d: any) => d.status === 'completed').length;
          const currentDest = dests.find((d: any) => d.status === 'unlocked') || dests[0];
          return {
            ...t,
            destinations_count: dests.length,
            completed_destinations_count: completedCount,
            progress_percent: dests.length > 0 ? Math.round((completedCount / dests.length) * 100) : 0,
            cover_image: dests[0]?.image_url || 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
            current_destination_name: currentDest?.name,
          };
        });

        return NextResponse.json({ success: true, trips: enriched });
      }
    }

    // Demo store
    const trips = demoStore.getUserTrips(userId);
    const enriched = trips.map((t) => {
      const dests = demoStore.getDestinations(t.id);
      const completedCount = dests.filter((d) => d.status === 'completed').length;
      const currentDest = dests.find((d) => d.status === 'unlocked') || dests[0];
      return {
        ...t,
        destinations_count: dests.length,
        completed_destinations_count: completedCount,
        progress_percent: dests.length > 0 ? Math.round((completedCount / dests.length) * 100) : 0,
        cover_image: dests[0]?.image_url || 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
        current_destination_name: currentDest?.name,
      };
    });

    return NextResponse.json({ success: true, trips: enriched });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch trips';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
