import { NextRequest, NextResponse } from 'next/server';
import { UsernameSchema } from '@/lib/validation/schemas';
import { demoStore } from '@/lib/storage/demo-store';
import { isSupabaseServerConfigured, createServerClient } from '@/lib/supabase/server';
import { Profile } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UsernameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid username' },
        { status: 400 }
      );
    }

    const { username } = parsed.data;

    // Check if client provided an existing guest user id header/cookie
    const existingUserId = req.headers.get('x-wanderly-user-id') || req.cookies.get('wanderly_user_id')?.value;

    let profile: Profile | null = null;

    if (isSupabaseServerConfigured()) {
      const supabase = createServerClient();
      if (supabase) {
        // Look up by username
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (existingProfile) {
          profile = existingProfile;
        } else {
          // If no existing profile, create anonymous user in Supabase
          const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
          if (authError || !authData.user) {
            return NextResponse.json({ error: 'Failed to create anonymous session' }, { status: 500 });
          }

          const newProfile: Profile = {
            id: authData.user.id,
            username,
            display_name: username,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

          if (insertError) {
            return NextResponse.json({ error: 'Could not create profile' }, { status: 500 });
          }
          profile = inserted;
        }
      }
    }

    // Demo store fallback
    if (!profile) {
      const existing = demoStore.getProfileByUsername(username);
      if (existing) {
        profile = existing;
      } else {
        const userId = existingUserId || `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        profile = {
          id: userId,
          username,
          display_name: username,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        demoStore.upsertProfile(profile);
      }
    }

    // Check for user's active trip
    const activeTrip = demoStore.getUserActiveTrip(profile.id);

    const response = NextResponse.json({
      success: true,
      profile,
      activeTripId: activeTrip ? activeTrip.id : null,
    });

    // Set HTTP cookie for session persistence
    response.cookies.set('wanderly_user_id', profile.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false, // Accessible to client
      sameSite: 'lax',
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
