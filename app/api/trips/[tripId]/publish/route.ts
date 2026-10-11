import { NextRequest, NextResponse } from 'next/server';
import { demoStore } from '@/lib/storage/demo-store';
import { isSupabaseServerConfigured, createServerClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const userId = req.headers.get('x-wanderly-user-id') || '';

    const body = await req.json();
    const {
      publicTitle,
      publicDescription,
      vibe = 'Scenic Mist',
      polish_with_ai = false,
      destinations = [],
    } = body;

    let finalTitle = publicTitle;
    let finalDescription = publicDescription;

    // Optional AI Agent Polish
    if (polish_with_ai) {
      const geminiApiKey =
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_AI_API_KEY ||
        (process.env.AI_API_KEY?.startsWith('AIza') ? process.env.AI_API_KEY : undefined);

      if (geminiApiKey) {
        try {
          const aiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
          const aiPrompt = `You are Wanderly's Chief Adventure Storyteller.
A traveler just completed an expedition with the following custom destinations and corrected notes:
Destinations: ${destinations.map((d: any) => `${d.name} (Spent: ₹${d.actual_spend || d.estimated_cost || 0})`).join(', ')}.
Vibe: ${vibe}.
Draft Title: "${publicTitle || 'Mystery Quest'}".

Provide a JSON object with:
1. "polished_title": A catchy, evocative mystery adventure title for backpackers (max 7 words).
2. "polished_description": An exciting 2-sentence public quest manifesto summarizing the best secret spots and realistic costs.
Format: {"polished_title": "...", "polished_description": "..."}`;

          const res = await fetch(aiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(10000),
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: aiPrompt }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              if (parsed.polished_title) finalTitle = parsed.polished_title;
              if (parsed.polished_description) finalDescription = parsed.polished_description;
            }
          }
        } catch {
          // fallback to traveler draft
        }
      }
    }

    if (!finalTitle) {
      finalTitle = `Mystery Journey • ${vibe}`;
    }
    if (!finalDescription) {
      finalDescription = `Verified community expedition with authentic travel prices and hidden waypoints.`;
    }

    // 1. Update in Supabase if configured
    if (isSupabaseServerConfigured()) {
      const supabase = createServerClient();
      if (supabase) {
        await supabase
          .from('trips')
          .update({
            is_public: true,
            public_title: finalTitle,
            public_description: finalDescription,
            vibe,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tripId);

        if (destinations && destinations.length > 0) {
          for (const d of destinations) {
            await supabase
              .from('destinations')
              .update({
                name: d.name,
                actual_spend: d.actual_spend,
                custom_notes: d.custom_notes,
              })
              .eq('id', d.id);
          }
        }
      }
    }

    // 2. Update in DemoStore
    const published = demoStore.publishTrip(tripId, {
      publicTitle: finalTitle,
      publicDescription: finalDescription,
      vibe,
      destinations,
    });

    return NextResponse.json({
      success: true,
      published: true,
      trip: published,
      public_title: finalTitle,
      public_description: finalDescription,
    });
  } catch (err: any) {
    console.error('Publish quest error:', err);
    return NextResponse.json({ error: err.message || 'Failed to publish mystery quest' }, { status: 500 });
  }
}
