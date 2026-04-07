import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql<{
      id: number;
      office_name: string | null;
      address: string | null;
      email: string | null;
      phone: string | null;
      latitude: number | null;
      longitude: number | null;
      map_embed_url: string | null;
    }[]>`
      SELECT id, office_name, address, email, phone, latitude, longitude, map_embed_url
      FROM contact
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    const row = rows[0] ?? null;
    return NextResponse.json({ data: row });
  } catch (error) {
    console.error('Unexpected contact settings error:', error);
    return NextResponse.json(
      { error: 'Unexpected error loading contact settings.' },
      { status: 500 }
    );
  }
}

