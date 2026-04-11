import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { toMysqlJsonArray } from '@/lib/mysql-json';
import { isBase64Image, isCloudinaryPublicId } from '@/lib/cloudinary';
import { cloudinary } from '@/lib/cloudinary-server';

const allowedCategories = new Set(['general', 'events', 'announcements']);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id: idValue } = await context.params;
    const id = Number(idValue);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid news id' }, { status: 400 });
    }

    const body = await request.json();
    const existing = await sql<Array<{ image: string | null }>>`
      SELECT image
      FROM news
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!existing[0]) {
      return NextResponse.json({ error: 'News article not found' }, { status: 404 });
    }

    const imageValue = body.image ?? body.featured_image ?? null;
    let image = imageValue ?? existing[0].image;

    if (isBase64Image(imageValue)) {
      if (isCloudinaryPublicId(existing[0].image)) {
        await cloudinary.uploader.destroy(existing[0].image as string);
      }

      image = (
        await cloudinary.uploader.upload(imageValue, {
          folder: 'mamsa/news',
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        })
      ).public_id;
    }

    const category = allowedCategories.has(String(body.category ?? '').trim())
      ? String(body.category).trim()
      : 'general';

    const tagsJson = toMysqlJsonArray(body.tags);
    await sql`
      UPDATE news
      SET title = ${body.title ?? ''},
          excerpt = ${body.excerpt ?? null},
          content = ${body.content ?? ''},
          category = ${category},
          date = ${body.date ?? new Date().toISOString()},
          image = ${image},
          featured = ${body.featured ?? false},
          author = ${body.author ?? 'Admin'},
          tags = ${tagsJson},
          updated_at = NOW()
      WHERE id = ${id}
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT *
      FROM news
      WHERE id = ${id}
      LIMIT 1
    `;

    return NextResponse.json({ data: { ...rows[0], featured_image: rows[0]?.image, status: 'published' } });
  } catch (error) {
    console.error('[api/admin/news/[id]][PATCH] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id: idValue } = await context.params;
    const id = Number(idValue);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid news id' }, { status: 400 });
    }

    const rows = await sql<Array<{ id: number; image: string | null }>>`
      SELECT id, image
      FROM news
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: 'News article not found' }, { status: 404 });
    }

    await sql`DELETE FROM news WHERE id = ${id}`;

    if (isCloudinaryPublicId(rows[0].image)) {
      await cloudinary.uploader.destroy(rows[0].image as string);
    }

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error('[api/admin/news/[id]][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
