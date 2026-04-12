import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';
import { toMysqlJson, toMysqlJsonArray } from '@/lib/mysql-json';
import { isBase64Image, saveImage } from '@/lib/upload';

export async function GET() {
  await requireAdmin();

  try {
    const rows = await sql`
      SELECT *
      FROM gallery
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('[api/admin/gallery][GET] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const imageValue = body.image ?? body.image_url ?? null;
    const imageUrl = isBase64Image(imageValue) ? await saveImage(imageValue, 'gallery') : imageValue;

    const tagsJson = toMysqlJsonArray(body.tags);
    const dimensionsJson = toMysqlJson(body.dimensions ?? null);
    const insertId = await insertAndGetId`
      INSERT INTO gallery (title, description, image_url, category, tags, photographer, location, event_date, file_size, dimensions, status, featured, alt_text, created_by, updated_by)
      VALUES (${body.title}, ${body.description ?? null}, ${imageUrl}, ${body.category ?? null}, ${tagsJson}, ${body.photographer ?? null}, ${body.location ?? null}, ${body.event_date ?? null}, ${body.file_size ?? null}, ${dimensionsJson}, ${body.status ?? 'active'}, ${body.featured ?? false}, ${body.alt_text ?? null}, ${body.created_by ?? null}, ${body.updated_by ?? null})
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT *
      FROM gallery
      WHERE id = ${insertId}
      LIMIT 1
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/gallery][POST] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
