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
    const imageValue = body.image ?? body.image_url ?? null;
    const imageUrl = isBase64Image(imageValue)
      ? (
          await cloudinary.uploader.upload(imageValue, {
            folder: 'mamsa/gallery',
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          })
        ).public_id
      : imageValue;

    const rows = await sql`
      INSERT INTO gallery (title, description, image_url, category, tags, photographer, location, event_date, file_size, dimensions, status, featured, alt_text, created_by, updated_by)
      VALUES (${body.title}, ${body.description ?? null}, ${imageUrl}, ${body.category ?? null}, ${body.tags ?? []}, ${body.photographer ?? null}, ${body.location ?? null}, ${body.event_date ?? null}, ${body.file_size ?? null}, ${body.dimensions ?? null}, ${body.status ?? 'active'}, ${body.featured ?? false}, ${body.alt_text ?? null}, ${body.created_by ?? null}, ${body.updated_by ?? null})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/gallery][POST] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
