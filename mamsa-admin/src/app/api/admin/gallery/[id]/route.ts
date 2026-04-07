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

    const existing = await sql<{ cover_image: string | null }[]>`
      SELECT cover_image
      FROM gallery
      WHERE id = ${numericId}
      LIMIT 1
    `;

    let coverImage = body.cover_image ?? body.image_url ?? existing[0]?.cover_image ?? null;
    if (isBase64Image(body.cover_image ?? body.image_url ?? null)) {
      if (isCloudinaryPublicId(existing[0]?.cover_image)) {
        await cloudinary.uploader.destroy(existing[0].cover_image as string);
      }

      const uploaded = await cloudinary.uploader.upload(body.cover_image ?? body.image_url, {
        folder: 'mamsa/gallery',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });
      coverImage = uploaded.public_id;
    }

    const rows = await sql`
      UPDATE gallery
      SET title = ${body.title},
          description = ${body.description ?? null},
          category = ${body.category ?? null},
          cover_image = ${coverImage},
          status = ${body.status ?? 'active'},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${numericId}
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] ?? null });
  } catch (error) {
    console.error('[api/admin/gallery][PATCH] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    const numericId = Number(id);

    const galleryRows = await sql<{ cover_image: string | null }[]>`
      SELECT cover_image
      FROM gallery
      WHERE id = ${numericId}
      LIMIT 1
    `;

    const imageRows = await sql<{ image: string | null }[]>`
      SELECT image
      FROM gallery_images
      WHERE gallery_id = ${numericId}
    `;

    await sql`DELETE FROM gallery_images WHERE gallery_id = ${numericId}`;
    await sql`DELETE FROM gallery WHERE id = ${numericId}`;

    if (isCloudinaryPublicId(galleryRows[0]?.cover_image)) {
      await cloudinary.uploader.destroy(galleryRows[0].cover_image as string);
    }

    for (const row of imageRows) {
      if (isCloudinaryPublicId(row.image)) {
        await cloudinary.uploader.destroy(row.image as string);
      }
    }

    return NextResponse.json({ data: true });
  } catch (error) {
    console.error('[api/admin/gallery][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
