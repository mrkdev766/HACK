import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseServerConfigured, createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-wanderly-user-id') || req.cookies.get('wanderly_user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate MIME type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload JPG, PNG, or WebP images.' },
        { status: 400 }
      );
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image size exceeds 10MB limit.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `${userId}/${fileName}`;

    if (isSupabaseServerConfigured()) {
      const supabase = createServerClient();
      if (supabase) {
        const { error } = await supabase.storage
          .from('user-photos')
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (error) {
          throw new Error(`Storage upload failed: ${error.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('user-photos')
          .getPublicUrl(storagePath);

        return NextResponse.json({
          success: true,
          url: publicUrlData.publicUrl,
          path: storagePath,
        });
      }
    }

    // Demo store fallback: generate base64 data URL
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      path: `demo/${fileName}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Photo upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
