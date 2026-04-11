import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';
import { toMysqlJsonArray } from '@/lib/mysql-json';
import { isBase64Image } from '@/lib/cloudinary';
import { cloudinary } from '@/lib/cloudinary-server';

export async function GET() {
  await requireAdmin();

  try {
    const rows = await sql`
      SELECT *
      FROM events
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('[api/admin/events][GET] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const imageValue = body.image ?? body.featured_image ?? null;
    const featuredImage = isBase64Image(imageValue)
      ? (
          await cloudinary.uploader.upload(imageValue, {
            folder: 'mamsa/events',
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          })
        ).public_id
      : imageValue;

    const tagsJson = toMysqlJsonArray(body.tags);
    const insertId = await insertAndGetId`
      INSERT INTO events (title, description, date, time, location, status, featured_image, capacity, registration_required, registration_deadline, organizer, contact_email, contact_phone, tags, created_by, updated_by)
      VALUES (${body.title}, ${body.description ?? null}, ${body.date ?? null}, ${body.time ?? null}, ${body.location ?? null}, ${body.status ?? 'upcoming'}, ${featuredImage}, ${body.capacity ?? null}, ${body.registration_required ?? false}, ${body.registration_deadline ?? null}, ${body.organizer ?? null}, ${body.contact_email ?? null}, ${body.contact_phone ?? null}, ${tagsJson}, ${body.created_by ?? null}, ${body.updated_by ?? null})
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT *
      FROM events
      WHERE id = ${insertId}
      LIMIT 1
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/events][POST] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
