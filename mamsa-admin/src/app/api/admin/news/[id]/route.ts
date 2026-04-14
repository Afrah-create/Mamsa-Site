import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { apiEnvelope } from '@/lib/api-envelope';
import { parseTagsBody } from '@/lib/gallery-request-body';
import { toMysqlJsonArray } from '@/lib/mysql-json';
import { isBase64Image, isLocalUploadPath } from '@/lib/upload';
import { deleteImage, saveImage } from '@/lib/upload-server';
import { rowToNewsArticle } from '@/types/news';

const allowedCategories = new Set(['general', 'events', 'announcements']);

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id: idValue } = await context.params;
    const id = Number(idValue);

    if (!Number.isFinite(id)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid news id' });
    }

    const body = await request.json();
    const existing = await sql<Array<{ image: string | null }>>`
      SELECT image
      FROM news
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!existing[0]) {
      return apiEnvelope(false, { status: 404, error: 'News article not found' });
    }

    const imageValue = body.image ?? body.featured_image ?? null;
    let image = imageValue ?? existing[0].image;

    if (isBase64Image(imageValue)) {
      if (isLocalUploadPath(existing[0].image)) {
        await deleteImage(existing[0].image);
      }

      image = await saveImage(imageValue, 'news');
    }

    const category = allowedCategories.has(String(body.category ?? '').trim())
      ? String(body.category).trim()
      : 'general';

    const tagsJson = toMysqlJsonArray(parseTagsBody(body.tags));
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

    const rows = await sql<{
      id: number;
      title: string;
      excerpt: string | null;
      content: string | null;
      image: string | null;
      author: string | null;
      tags: unknown;
      date: string | Date | null;
      created_at: string | Date;
      updated_at: string | Date | null;
      featured: number;
    }[]>`
      SELECT *
      FROM news
      WHERE id = ${id}
      LIMIT 1
    `;

    const item = rows[0]
      ? {
          ...rowToNewsArticle(rows[0]),
          status: Number(rows[0].featured ?? 0) === 1 ? 'published' : 'draft',
          is_featured: Number(rows[0].featured ?? 0) === 1 ? 1 : 0,
        }
      : null;
    return apiEnvelope(true, { data: item, message: 'Article updated' });
  } catch (error) {
    console.error('[api/admin/news/[id]][PUT] Unexpected error:', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Unexpected error',
      message: 'Failed to update article',
    });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return PUT(request, context);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id: idValue } = await context.params;
    const id = Number(idValue);

    if (!Number.isFinite(id)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid news id' });
    }

    const rows = await sql<Array<{ id: number; image: string | null }>>`
      SELECT id, image
      FROM news
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!rows[0]) {
      return apiEnvelope(false, { status: 404, error: 'News article not found' });
    }

    await sql`DELETE FROM news WHERE id = ${id}`;

    if (isLocalUploadPath(rows[0].image)) {
      await deleteImage(rows[0].image);
    }

    return apiEnvelope(true, { data: { id }, message: 'Article deleted' });
  } catch (error) {
    console.error('[api/admin/news/[id]][DELETE] Unexpected error:', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Unexpected error',
      message: 'Failed to delete article',
    });
  }
}
