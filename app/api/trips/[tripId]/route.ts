import { NextRequest, NextResponse } from 'next/server';
import { TripService } from '@/services/trip-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const userId = req.headers.get('x-wanderly-user-id') || req.cookies.get('wanderly_user_id')?.value || '';

    const tripDetail = await TripService.getTripDetail(tripId, userId);

    if (!tripDetail) {
      return NextResponse.json({ error: 'Trip not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: tripDetail,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching trip';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
