import { NextRequest, NextResponse } from 'next/server';
import { TripService } from '@/services/trip-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const userId = req.headers.get('x-wanderly-user-id') || req.cookies.get('wanderly_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const tripDetail = await TripService.getTripDetail(tripId, userId);

    if (!tripDetail) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Only destinations that are unlocked or completed have valid coordinates
    const mapNodes = tripDetail.destinations.map((d) => ({
      id: d.id,
      sequence_number: d.sequence_number,
      status: d.status,
      name: d.status === 'locked' ? `Stop ${d.sequence_number}` : d.name,
      latitude: d.latitude,
      longitude: d.longitude,
      isCurrent: d.isCurrent,
    }));

    return NextResponse.json({
      success: true,
      trip_id: tripId,
      starting_location: tripDetail.trip.starting_location_name,
      total_points: tripDetail.totalPoints,
      nodes: mapNodes,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching map';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
