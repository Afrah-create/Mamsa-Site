import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';
import { toMysqlJson, toMysqlJsonArray } from '@/lib/mysql-json';
import { isBase64Image } from '@/lib/upload';
import { saveImage } from '@/lib/upload-server';
import { apiEnvelope } from '@/lib/api-envelope';

function parseTags(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export async function GET(request: Request) {
  await requireAdmin();

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20') || 20));
    const offset = (page - 1) * limit;
    const search = searchParams.get('search')?.trim() ?? '';
    const category = searchParams.get('category')?.trim() ?? '';

    const like = search ? `%${search}%` : null;
    const catOk = category && category !== 'all' ? category : null;

    const countRows = await sql<{ total: number }[]>`
      SELECT COUNT(*) AS total
      FROM gallery
      WHERE 1 = 1
        ${like ? sql`AND (title LIKE ${like} OR description LIKE ${like})` : sql``}
        ${catOk ? sql`AND category = ${catOk}` : sql``}
    `;
    const total = Number(countRows[0]?.total ?? 0);

    const [rows, categoryRows] = await Promise.all([
      sql<Record<string, unknown>[]>`
      SELECT *
      FROM gallery
      WHERE 1 = 1
        ${like ? sql`AND (title LIKE ${like} OR description LIKE ${like})` : sql``}
        ${catOk ? sql`AND category = ${catOk}` : sql``}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
      sql<{ category: string }[]>`
      SELECT DISTINCT category AS category
      FROM gallery
      WHERE category IS NOT NULL AND TRIM(category) <> ''
      ORDER BY category ASC
    `,
    ]);

    const categories = categoryRows.map((r) => r.category).filter(Boolean);

    return apiEnvelope(true, {
      data: {
        items: rows,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
        categories,
      },
      message: 'Gallery loaded',
    });
  } catch (error) {
    console.error('[api/admin/gallery][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load gallery',
    });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const title = String(body.title ?? '').trim();
    if (!title) {
      return apiEnvelope(false, {
        status: 400,
        error: 'title is required',
        message: 'Validation failed',
      });
    }

    let imageUrl: string | null = body.image_url ?? body.image ?? null;
    if (isBase64Image(imageUrl)) {
      try {
        imageUrl = await saveImage(imageUrl as string, 'gallery');
      } catch (e) {
        return apiEnvelope(false, {
          status: 500,
          error: e instanceof Error ? e.message : 'Image upload failed',
          message: 'Image upload error',
        });
      }
    }

    const tags = parseTags(body.tags);
    const tagsJson = toMysqlJsonArray(tags);
    const dimensionsJson = toMysqlJson(body.dimensions ?? null);

    const insertId = await insertAndGetId`
      INSERT INTO gallery (
        title, description, image_url, category, tags, photographer, location, event_date,
        file_size, dimensions, status, featured, alt_text, created_by, updated_by
      )
      VALUES (
        ${title},
        ${body.description ?? null},
        ${imageUrl},
        ${body.category ?? null},
        ${tagsJson},
        ${body.photographer ?? null},
        ${body.location ?? null},
        ${body.event_date ?? null},
        ${body.file_size ?? null},
        ${dimensionsJson},
        ${body.status ?? 'active'},
        ${body.is_featured ?? body.featured ?? 0},
        ${body.alt_text ?? null},
        ${body.created_by ?? null},
        ${body.updated_by ?? null}
      )
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT * FROM gallery WHERE id = ${insertId} LIMIT 1
    `;

    return apiEnvelope(true, { status: 201, data: rows[0], message: 'Gallery item created' });
  } catch (error) {
    console.error('[api/admin/gallery][POST]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to create gallery item',
    });
  }
}
