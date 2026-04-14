import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';
import { parseTagsBody } from '@/lib/gallery-request-body';
import { toMysqlJson, toMysqlJsonArray } from '@/lib/mysql-json';
import { isBase64Image } from '@/lib/upload';
import { saveImage } from '@/lib/upload-server';
import { apiEnvelope } from '@/lib/api-envelope';
import type { GalleryListResponse, GalleryRowRaw } from '@/types/gallery';
import { parseDimensionsInput, rowToGalleryItem } from '@/types/gallery';

function normalizeStatus(input: unknown): 'active' | 'inactive' {
  if (input == null || input === '') return 'active';
  const s = String(input).trim().toLowerCase();
  return s === 'inactive' ? 'inactive' : 'active';
}

function normalizeFeatured(input: unknown): number {
  return Number(input) === 1 ? 1 : 0;
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

    const [countRows, activeRows, featuredRows, categoryRows, listRows] = await Promise.all([
      sql<{ total: number }[]>`
        SELECT COUNT(*) AS total
        FROM gallery
        WHERE 1 = 1
          ${like ? sql`AND (title LIKE ${like} OR description LIKE ${like})` : sql``}
          ${catOk ? sql`AND category = ${catOk}` : sql``}
      `,
      sql<{ c: number }[]>`
        SELECT COUNT(*) AS c
        FROM gallery
        WHERE 1 = 1
          ${like ? sql`AND (title LIKE ${like} OR description LIKE ${like})` : sql``}
          ${catOk ? sql`AND category = ${catOk}` : sql``}
          AND status = 'active'
      `,
      sql<{ c: number }[]>`
        SELECT COUNT(*) AS c
        FROM gallery
        WHERE 1 = 1
          ${like ? sql`AND (title LIKE ${like} OR description LIKE ${like})` : sql``}
          ${catOk ? sql`AND category = ${catOk}` : sql``}
          AND featured = 1
      `,
      sql<{ category: string }[]>`
        SELECT DISTINCT category AS category
        FROM gallery
        WHERE category IS NOT NULL AND TRIM(category) <> ''
        ORDER BY category ASC
      `,
      sql<GalleryRowRaw[]>`
        SELECT *
        FROM gallery
        WHERE 1 = 1
          ${like ? sql`AND (title LIKE ${like} OR description LIKE ${like})` : sql``}
          ${catOk ? sql`AND category = ${catOk}` : sql``}
        ORDER BY featured DESC, created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
    ]);

    const total = Number(countRows[0]?.total ?? 0);
    const categories = categoryRows.map((r) => r.category).filter(Boolean);
    const items = listRows.map(rowToGalleryItem);
    const totalPages = Math.ceil(total / limit) || 0;

    const payload: GalleryListResponse = {
      items,
      total,
      totalPages,
      categories,
      page,
      limit,
      stats: {
        active: Number(activeRows[0]?.c ?? 0),
        featured: Number(featuredRows[0]?.c ?? 0),
        categoriesCount: categories.length,
      },
    };

    return apiEnvelope(true, {
      data: payload,
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
  const session = await requireAdmin();

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

    const tags = parseTagsBody(body.tags);
    const tagsJson = toMysqlJsonArray(tags);
    const dimObj = parseDimensionsInput(body.dimensions);
    const dimensionsJson = toMysqlJson(dimObj);
    const status = normalizeStatus(body.status);
    const featured = normalizeFeatured(body.is_featured ?? body.featured ?? 0);
    const actor = String(session.id);

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
        ${status},
        ${featured},
        ${body.alt_text ?? null},
        ${actor},
        ${actor}
      )
    `;

    const rows = await sql<GalleryRowRaw[]>`
      SELECT * FROM gallery WHERE id = ${insertId} LIMIT 1
    `;
    const item = rows[0] ? rowToGalleryItem(rows[0]) : null;

    return apiEnvelope(true, { status: 201, data: item, message: 'Gallery item created' });
  } catch (error) {
    console.error('[api/admin/gallery][POST]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to create gallery item',
    });
  }
}
