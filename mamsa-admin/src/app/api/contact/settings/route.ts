import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
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

export async function PATCH(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();

    const rows = await sql<{
      id: number;
      office_name: string | null;
      address: string | null;
      email: string | null;
      phone: string | null;
      latitude: number | null;
      longitude: number | null;
      map_embed_url: string | null;
      updated_at: string;
    }[]>`
      INSERT INTO contact_settings (office_name, address, email, phone, latitude, longitude, map_embed_url, updated_at)
      VALUES (${body.office_name ?? null}, ${body.address ?? null}, ${body.email ?? null}, ${body.phone ?? null}, ${body.latitude ?? null}, ${body.longitude ?? null}, ${body.map_embed_url ?? null}, ${new Date().toISOString()})
      ON CONFLICT (id)
      DO UPDATE SET
        office_name = EXCLUDED.office_name,
        address = EXCLUDED.address,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        map_embed_url = EXCLUDED.map_embed_url,
        updated_at = EXCLUDED.updated_at
      RETURNING id, office_name, address, email, phone, latitude, longitude, map_embed_url, updated_at
    `;

    return NextResponse.json({ data: rows[0] ?? null });
  } catch (error) {
    console.error('Unexpected contact settings patch error:', error);
    return NextResponse.json(
      { error: 'Unexpected error saving contact settings.' },
      { status: 500 }
    );
  }
}

