import { NextRequest, NextResponse } from 'next/server';
import { demoStore } from '@/lib/storage/demo-store';
import { isSupabaseServerConfigured, createServerClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const userId = req.headers.get('x-wanderly-user-id') || req.cookies.get('wanderly_user_id')?.value || '';

    // 1. Try Supabase
    if (isSupabaseServerConfigured()) {
      const supabase = createServerClient();
      if (supabase) {
        const { data: entries } = await supabase
          .from('journal_entries')
          .select('*, destinations(name), journal_photos(*)')
          .eq('trip_id', tripId)
          .order('created_at', { ascending: false });

        if (entries && entries.length > 0) {
          const formatted = entries.map((e) => ({
            id: e.id,
            trip_id: e.trip_id,
            destination_id: e.destination_id,
            destination_name: (e.destinations as unknown as { name?: string })?.name || 'Destination',
            mission_id: e.mission_id,
            note: e.note,
            actual_spend: Number(e.actual_spend),
            currency: e.currency,
            created_at: e.created_at,
            photos: (e.journal_photos || []).map((p: { id: string; storage_path: string; caption?: string }) => ({
              id: p.id,
              journal_entry_id: e.id,
              storage_path: p.storage_path,
              caption: p.caption,
            })),
          }));

          return NextResponse.json({
            success: true,
            trip_id: tripId,
            entries: formatted,
          });
        }
      }
    }

    // 2. DemoStore fallback
    const trip = demoStore.getTrip(tripId);
    const entries = trip ? demoStore.getJournalEntries(tripId) : [];

    return NextResponse.json({
      success: true,
      trip_id: tripId,
      entries,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching journal';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
