import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { toMysqlJson, toMysqlJsonArray } from '@/lib/mysql-json';
import { deleteImage, isBase64Image, isLocalUploadPath, saveImage } from '@/lib/upload';

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
      if (isLocalUploadPath(existing[0]?.image_url)) {
        await deleteImage(existing[0].image_url);
      }

      imageUrl = await saveImage(imageValue, 'gallery');
    }

    const tagsJson = toMysqlJsonArray(body.tags);
    const dimensionsJson = toMysqlJson(body.dimensions ?? null);
    await sql`
      UPDATE gallery
      SET title = ${body.title},
          description = ${body.description ?? null},
          image_url = ${imageUrl},
          category = ${body.category ?? null},
          tags = ${tagsJson},
          photographer = ${body.photographer ?? null},
          location = ${body.location ?? null},
          event_date = ${body.event_date ?? null},
          file_size = ${body.file_size ?? null},
          dimensions = ${dimensionsJson},
          status = ${body.status ?? 'active'},
          featured = ${body.featured ?? false},
          alt_text = ${body.alt_text ?? null},
          updated_by = ${body.updated_by ?? null},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${numericId}
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT *
      FROM gallery
      WHERE id = ${numericId}
      LIMIT 1
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

    await deleteImage(galleryRows[0]?.image_url);

    return NextResponse.json({ data: true });
  } catch (error) {
    console.error('[api/admin/gallery][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
