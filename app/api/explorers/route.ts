import { NextRequest, NextResponse } from 'next/server';
import { demoStore } from '@/lib/storage/demo-store';

export async function GET(req: NextRequest) {
  try {
    const currentUserId = req.headers.get('x-wanderly-user-id') || 'guest_user';
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    const explorers = demoStore.getExplorers(query, currentUserId);

    return NextResponse.json({
      success: true,
      explorers,
    });
  } catch (err: any) {
    console.error('Error fetching explorers:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch explorers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUserId = req.headers.get('x-wanderly-user-id') || 'guest_user';
    const body = await req.json();
    const { action, targetUserId, targetTripId } = body;

    if (action === 'friend_request' && targetUserId) {
      const result = demoStore.sendFriendRequest(currentUserId, targetUserId);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'accept_friend' && targetUserId) {
      const result = demoStore.acceptFriendRequest(currentUserId, targetUserId);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'join_live_quest' && targetTripId) {
      const result = demoStore.joinLiveQuest(currentUserId, targetTripId);
      return NextResponse.json({ ...result });
    }

    return NextResponse.json({ error: 'Invalid explorer action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error processing explorer action:', err);
    return NextResponse.json({ error: err.message || 'Action failed' }, { status: 500 });
  }
}
