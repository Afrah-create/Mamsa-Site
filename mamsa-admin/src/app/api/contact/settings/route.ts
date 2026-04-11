import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';

type ContactRow = {
  id: number;
  phone: string | null;
  email: string | null;
  address: string | null;
  office_hours: string | null;
  social_media: Record<string, unknown> | null;
  updated_at: string | null;
};

type ContactSettingsResponse = {
  id: number;
  office_name: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  map_embed_url: string | null;
  updated_at: string | null;
};

const asNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const asStringOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const mapRowToResponse = (row: ContactRow | null): ContactSettingsResponse | null => {
  if (!row) return null;

  const meta = row.social_media ?? {};
  return {
    id: row.id,
    office_name: asStringOrNull(meta.office_name),
    address: row.address,
    email: row.email,
    phone: row.phone,
    latitude: asNumberOrNull(meta.latitude),
    longitude: asNumberOrNull(meta.longitude),
    map_embed_url: asStringOrNull(meta.map_embed_url),
    updated_at: row.updated_at,
  };
};

export async function GET() {
  try {
    const rows = await sql<ContactRow[]>`
      SELECT id, phone, email, address, office_hours, social_media, updated_at
      FROM contact
      ORDER BY updated_at IS NULL ASC, updated_at DESC, id DESC
      LIMIT 1
    `;

    return NextResponse.json({ data: mapRowToResponse(rows[0] ?? null) });
  } catch (error) {
    console.error('Unexpected contact settings error:', error);
    return NextResponse.json({ error: 'Unexpected error loading contact settings.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();

    const existingRows = await sql<ContactRow[]>`
      SELECT id, phone, email, address, office_hours, social_media, updated_at
      FROM contact
      ORDER BY updated_at IS NULL ASC, updated_at DESC, id DESC
      LIMIT 1
    `;

    const existing = existingRows[0] ?? null;
    const existingSocial = (existing?.social_media ?? {}) as Record<string, unknown>;

    const mergedSocial: Record<string, unknown> = {
      ...existingSocial,
      office_name: body.office_name ?? existingSocial.office_name ?? null,
      latitude: body.latitude ?? existingSocial.latitude ?? null,
      longitude: body.longitude ?? existingSocial.longitude ?? null,
      map_embed_url: body.map_embed_url ?? existingSocial.map_embed_url ?? null,
    };
    const mergedSocialJson = JSON.stringify(mergedSocial);

    if (existing) {
      await sql`
        UPDATE contact
        SET address = ${body.address ?? existing.address ?? null},
            email = ${body.email ?? existing.email ?? null},
            phone = ${body.phone ?? existing.phone ?? null},
            social_media = ${mergedSocialJson},
            updated_at = NOW()
        WHERE id = ${existing.id}
      `;

      const updatedRows = await sql<ContactRow[]>`
        SELECT id, phone, email, address, office_hours, social_media, updated_at
        FROM contact
        WHERE id = ${existing.id}
        LIMIT 1
      `;

      return NextResponse.json({ data: mapRowToResponse(updatedRows[0] ?? null) });
    }

    const insertId = await insertAndGetId`
      INSERT INTO contact (address, email, phone, office_hours, social_media)
      VALUES (${body.address ?? null}, ${body.email ?? null}, ${body.phone ?? null}, ${null}, ${mergedSocialJson})
    `;

    const insertedRows = await sql<ContactRow[]>`
      SELECT id, phone, email, address, office_hours, social_media, updated_at
      FROM contact
      WHERE id = ${insertId}
      LIMIT 1
    `;

    return NextResponse.json({ data: mapRowToResponse(insertedRows[0] ?? null) });
  } catch (error) {
    console.error('Unexpected contact settings patch error:', error);
    return NextResponse.json({ error: 'Unexpected error saving contact settings.' }, { status: 500 });
  }
}
