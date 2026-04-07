import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { isBase64Image } from '@/lib/cloudinary';
import { cloudinary } from '@/lib/cloudinary-server';

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
    const coverImage = isBase64Image(body.cover_image ?? body.image_url ?? null)
      ? (
          await cloudinary.uploader.upload(body.cover_image ?? body.image_url, {
            folder: 'mamsa/gallery',
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          })
        ).public_id
      : (body.cover_image ?? body.image_url ?? null);

    const rows = await sql`
      INSERT INTO gallery (title, description, category, cover_image, status)
      VALUES (${body.title}, ${body.description ?? null}, ${body.category ?? null}, ${coverImage}, ${body.status ?? 'active'})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/gallery][POST] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
