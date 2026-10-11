import { NextRequest, NextResponse } from 'next/server';
import { CompleteMissionSchema } from '@/lib/validation/schemas';
import { MissionService } from '@/services/mission-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) {
  try {
    const { missionId } = await params;
    const userId = req.headers.get('x-wanderly-user-id') || req.cookies.get('wanderly_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CompleteMissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid mission submission data' },
        { status: 400 }
      );
    }

    const result = await MissionService.completeMission(userId, missionId, parsed.data);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to complete mission';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
