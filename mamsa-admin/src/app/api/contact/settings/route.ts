import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createServerClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client is not configured.' },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('contact_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to load contact settings:', error);
      return NextResponse.json(
        { error: 'Could not load contact settings.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected contact settings error:', error);
    return NextResponse.json(
      { error: 'Unexpected error loading contact settings.' },
      { status: 500 }
    );
  }
}

