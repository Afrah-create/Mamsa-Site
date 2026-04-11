import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';
import { toMysqlJson } from '@/lib/mysql-json';
import { isBase64Image } from '@/lib/cloudinary';
import { cloudinary } from '@/lib/cloudinary-server';

export async function GET() {
  await requireAdmin();

  try {
    const rows = await sql`
      SELECT id, full_name, slug, graduation_year, biography, achievements, current_position, organization, specialty, image_url, profile_links, featured, status, order_position, created_at
      FROM notable_alumni
      ORDER BY order_position IS NULL DESC, order_position ASC, created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('[api/admin/notable-alumni][GET] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const imageUrl = isBase64Image(body.image_url ?? null)
      ? (
          await cloudinary.uploader.upload(body.image_url, {
            folder: 'mamsa/about',
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          })
        ).public_id
      : (body.image_url ?? null);

    const profileLinksJson = toMysqlJson(body.profile_links ?? null);
    const insertId = await insertAndGetId`
      INSERT INTO notable_alumni (full_name, slug, graduation_year, biography, achievements, current_position, organization, specialty, image_url, profile_links, featured, status, order_position)
      VALUES (${body.full_name}, ${body.slug ?? null}, ${body.graduation_year ?? null}, ${body.biography}, ${body.achievements ?? null}, ${body.current_position ?? null}, ${body.organization ?? null}, ${body.specialty ?? null}, ${imageUrl}, ${profileLinksJson}, ${body.featured ?? false}, ${body.status}, ${body.order_position ?? 0})
    `;

    const rows = await sql`
      SELECT id, full_name, slug, graduation_year, biography, achievements, current_position, organization, specialty, image_url, profile_links, featured, status, order_position, created_at
      FROM notable_alumni
      WHERE id = ${insertId}
      LIMIT 1
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/notable-alumni][POST] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
