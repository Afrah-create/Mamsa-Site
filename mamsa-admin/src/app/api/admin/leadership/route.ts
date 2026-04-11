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
      SELECT *
      FROM leadership
      ORDER BY order_position ASC, created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('[api/admin/leadership][GET] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const imageValue = body.image ?? body.image_url ?? null;
    const image = isBase64Image(imageValue)
      ? (
          await cloudinary.uploader.upload(imageValue, {
            folder: 'mamsa/leadership',
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          })
        ).public_id
      : imageValue;

    const socialLinksJson = toMysqlJson(body.social_links ?? null);
    const insertId = await insertAndGetId`
      INSERT INTO leadership (name, position, bio, image_url, email, phone, department, year, social_links, status, order_position, created_by, updated_by)
      VALUES (${body.name}, ${body.position ?? null}, ${body.bio ?? null}, ${image}, ${body.email ?? null}, ${body.phone ?? null}, ${body.department ?? null}, ${body.year ?? null}, ${socialLinksJson}, ${body.status ?? 'active'}, ${body.order_position ?? 0}, ${body.created_by ?? null}, ${body.updated_by ?? null})
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT *
      FROM leadership
      WHERE id = ${insertId}
      LIMIT 1
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/leadership][POST] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
