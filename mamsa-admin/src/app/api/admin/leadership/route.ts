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
      FROM leadership
      ORDER BY "order" ASC, created_at DESC
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
    const image = isBase64Image(body.image ?? body.image_url ?? null)
      ? (
          await cloudinary.uploader.upload(body.image ?? body.image_url, {
            folder: 'mamsa/leadership',
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          })
        ).public_id
      : (body.image ?? body.image_url ?? null);

    const rows = await sql`
      INSERT INTO leadership (name, position, bio, image, "order", status)
      VALUES (${body.name}, ${body.position ?? null}, ${body.bio ?? null}, ${image}, ${body.order ?? body.order_position ?? 0}, ${body.status ?? 'active'})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/leadership][POST] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
