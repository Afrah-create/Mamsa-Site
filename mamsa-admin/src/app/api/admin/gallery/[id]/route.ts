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

    const existing = await sql<{ image_url: string | null }[]>`
      SELECT image_url
      FROM gallery
      WHERE id = ${numericId}
      LIMIT 1
    `;

    const imageValue = body.image ?? body.image_url ?? null;
    let imageUrl = imageValue ?? existing[0]?.image_url ?? null;
    if (isBase64Image(imageValue)) {
      if (isCloudinaryPublicId(existing[0]?.image_url)) {
        await cloudinary.uploader.destroy(existing[0].image_url as string);
      }

      const uploaded = await cloudinary.uploader.upload(imageValue, {
        folder: 'mamsa/gallery',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });
      imageUrl = uploaded.public_id;
    }

    const rows = await sql`
      UPDATE gallery
      SET title = ${body.title},
          description = ${body.description ?? null},
          image_url = ${imageUrl},
          category = ${body.category ?? null},
          tags = ${body.tags ?? []},
          photographer = ${body.photographer ?? null},
          location = ${body.location ?? null},
          event_date = ${body.event_date ?? null},
          file_size = ${body.file_size ?? null},
          dimensions = ${body.dimensions ?? null},
          status = ${body.status ?? 'active'},
          featured = ${body.featured ?? false},
          alt_text = ${body.alt_text ?? null},
          updated_by = ${body.updated_by ?? null},
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

    const galleryRows = await sql<{ image_url: string | null }[]>`
      SELECT image_url
      FROM gallery
      WHERE id = ${numericId}
      LIMIT 1
    `;
    await sql`DELETE FROM gallery WHERE id = ${numericId}`;

    if (isCloudinaryPublicId(galleryRows[0]?.image_url)) {
      await cloudinary.uploader.destroy(galleryRows[0].image_url as string);
    }

    return NextResponse.json({ data: true });
  } catch (error) {
    console.error('[api/admin/gallery][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
