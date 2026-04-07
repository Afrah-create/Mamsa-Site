import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { isBase64Image, isCloudinaryPublicId } from '@/lib/cloudinary';
import { cloudinary } from '@/lib/cloudinary-server';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    const numericId = Number(id);
    const body = await request.json();

    const existing = await sql<{ image: string | null }[]>`
      SELECT image
      FROM leadership
      WHERE id = ${numericId}
      LIMIT 1
    `;

    let image = body.image ?? body.image_url ?? existing[0]?.image ?? null;
    if (isBase64Image(body.image ?? body.image_url ?? null)) {
      if (isCloudinaryPublicId(existing[0]?.image)) {
        await cloudinary.uploader.destroy(existing[0].image as string);
      }

      const uploaded = await cloudinary.uploader.upload(body.image ?? body.image_url, {
        folder: 'mamsa/leadership',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });
      image = uploaded.public_id;
    }

    const rows = await sql`
      UPDATE leadership
      SET name = ${body.name},
          position = ${body.position ?? null},
          bio = ${body.bio ?? null},
          image = ${image},
          status = ${body.status ?? 'active'},
          "order" = ${body.order ?? body.order_position ?? 0},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${numericId}
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] ?? null });
  } catch (error) {
    console.error('[api/admin/leadership][PATCH] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    const numericId = Number(id);
    const existing = await sql<{ image: string | null }[]>`
      SELECT image
      FROM leadership
      WHERE id = ${numericId}
      LIMIT 1
    `;

    await sql`DELETE FROM leadership WHERE id = ${numericId}`;

    if (isCloudinaryPublicId(existing[0]?.image)) {
      await cloudinary.uploader.destroy(existing[0].image as string);
    }

    return NextResponse.json({ data: true });
  } catch (error) {
    console.error('[api/admin/leadership][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
