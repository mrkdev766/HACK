import { NextRequest, NextResponse } from 'next/server';
import { demoStore } from '@/lib/storage/demo-store';
import { isSupabaseServerConfigured, createServerClient } from '@/lib/supabase/server';
import { TripService } from '@/services/trip-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ destinationId: string }> }
) {
  try {
    const { destinationId } = await params;
    const userId = req.headers.get('x-wanderly-user-id') || req.cookies.get('wanderly_user_id')?.value || '';

    // 1. Try Supabase if configured
    if (isSupabaseServerConfigured()) {
      const supabase = createServerClient();
      if (supabase) {
        const { data: dest, error: destError } = await supabase
          .from('destinations')
          .select('*')
          .eq('id', destinationId)
          .maybeSingle();

        if (dest) {
          if (dest.status === 'locked') {
            return NextResponse.json(
              { error: 'This destination is locked. Complete the previous mission to unlock it.' },
              { status: 403 }
            );
          }

          const { data: trip } = await supabase
            .from('trips')
            .select('*')
            .eq('id', dest.trip_id)
            .maybeSingle();

          const { data: missions } = await supabase
            .from('missions')
            .select('*')
            .eq('destination_id', dest.id);

          const mission = missions && missions.length > 0 ? missions[0] : null;
          const clientView = TripService.redactDestination(dest, mission, true);

          return NextResponse.json({
            success: true,
            data: clientView,
            trip_id: dest.trip_id,
            currency: trip?.currency || 'INR',
          });
        }
      }
    }

    // 2. DemoStore fallback
    const dest = demoStore.getDestination(destinationId);
    if (!dest) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 404 });
    }

    if (dest.status === 'locked') {
      return NextResponse.json(
        { error: 'This destination is locked. Complete the previous mission to unlock it.' },
        { status: 403 }
      );
    }

    const trip = demoStore.getTrip(dest.trip_id);
    const mission = demoStore.getMissionForDestination(dest.id);
    const clientView = TripService.redactDestination(dest, mission, true);

    return NextResponse.json({
      success: true,
      data: clientView,
      trip_id: dest.trip_id,
      currency: trip?.currency || 'INR',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching destination';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/destinations/[destinationId]
 * Allows users to correct: actual_spend, custom_notes, preferred_transport
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ destinationId: string }> }
) {
  try {
    const { destinationId } = await params;
    const userId = req.headers.get('x-wanderly-user-id') || req.cookies.get('wanderly_user_id')?.value || '';
    const body = await req.json();
    const { actual_spend, custom_notes, preferred_transport } = body;

    // Try Supabase first
    if (isSupabaseServerConfigured()) {
      const supabase = createServerClient();
      if (supabase) {
        const updatePayload: Record<string, unknown> = {};
        if (actual_spend !== undefined) updatePayload.actual_spend = Number(actual_spend);
        if (custom_notes !== undefined) updatePayload.custom_notes = String(custom_notes);
        if (preferred_transport !== undefined) updatePayload.preferred_transport = String(preferred_transport);

        const { data, error } = await supabase
          .from('destinations')
          .update(updatePayload)
          .eq('id', destinationId)
          .select()
          .maybeSingle();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
      }
    }

    // DemoStore fallback — update in memory
    const dest = demoStore.getDestination(destinationId);
    if (!dest) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 404 });
    }

    if (actual_spend !== undefined) (dest as any).actual_spend = Number(actual_spend);
    if (custom_notes !== undefined) (dest as any).custom_notes = String(custom_notes);
    if (preferred_transport !== undefined) (dest as any).preferred_transport = String(preferred_transport);

    return NextResponse.json({ success: true, data: dest });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating destination';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

