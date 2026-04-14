import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';
import { apiEnvelope } from '@/lib/api-envelope';
import { parseTagsBody } from '@/lib/gallery-request-body';
import { toMysqlJsonArray } from '@/lib/mysql-json';
import { isBase64Image } from '@/lib/upload';
import { saveImage } from '@/lib/upload-server';
import type { NewsListResponse } from '@/types/news';
import { rowToNewsArticle } from '@/types/news';

const allowedCategories = new Set(['general', 'events', 'announcements']);

export async function GET(request: Request) {
  await requireAdmin();

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20') || 20));
    const offset = (page - 1) * limit;
    const search = searchParams.get('search')?.trim() ?? '';
    const status = searchParams.get('status')?.trim() ?? 'all';

    const like = search ? `%${search}%` : null;
    const statusFilter = status && status !== 'all' ? status : null;

    const [countRows, rows] = await Promise.all([
      sql<{ total: number }[]>`
      SELECT COUNT(*) AS total
      FROM news
      WHERE 1 = 1
      ${like ? sql`AND (title LIKE ${like} OR content LIKE ${like} OR author LIKE ${like})` : sql``}
      ${statusFilter === 'published' ? sql`AND featured = 1` : sql``}
      ${statusFilter === 'draft' ? sql`AND featured = 0` : sql``}
    `,
      sql<{
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
      }[]>`
      SELECT *
      FROM news
      WHERE 1 = 1
      ${like ? sql`AND (title LIKE ${like} OR content LIKE ${like} OR author LIKE ${like})` : sql``}
      ${statusFilter === 'published' ? sql`AND featured = 1` : sql``}
      ${statusFilter === 'draft' ? sql`AND featured = 0` : sql``}
      ORDER BY date DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    ]);

    const total = Number(countRows[0]?.total ?? 0);
    const items = rows.map((row) => {
      const item = rowToNewsArticle(row);
      const computedStatus: 'published' | 'draft' = Number((row as { featured?: unknown }).featured ?? 1) === 1 ? 'published' : 'draft';
      return {
        ...item,
        status: computedStatus,
        is_featured: Number((row as { featured?: unknown }).featured ?? 0) === 1 ? 1 : 0,
      };
    });
    const payload: NewsListResponse = {
      items,
      total,
      totalPages: Math.ceil(total / limit) || 0,
      page,
      limit,
    };
    return apiEnvelope(true, { data: payload, message: 'News loaded' });
  } catch (error) {
    console.error('[api/admin/news][GET] Unexpected error:', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Unexpected error',
      message: 'Failed to load news',
    });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();

    const title = String(body.title ?? '').trim();
    const content = String(body.content ?? '').trim();
    if (!title || !content) {
      return apiEnvelope(false, { status: 400, error: 'Title and content are required' });
    }

    const category = allowedCategories.has(String(body.category ?? '').trim())
      ? String(body.category).trim()
      : 'general';

    const imageValue = body.image ?? body.featured_image ?? null;
    const image = isBase64Image(imageValue) ? await saveImage(imageValue, 'news') : imageValue;

    const tagsJson = toMysqlJsonArray(parseTagsBody(body.tags));
    const insertId = await insertAndGetId`
      INSERT INTO news (title, excerpt, content, category, date, image, featured, author, tags, updated_at)
      VALUES (${title}, ${body.excerpt ?? null}, ${content}, ${category}, ${body.date ?? new Date().toISOString()}, ${image}, ${body.featured ?? false}, ${body.author ?? 'Admin'}, ${tagsJson}, NOW())
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
      WHERE id = ${insertId}
      LIMIT 1
    `;

    const item = rows[0]
      ? {
          ...rowToNewsArticle(rows[0]),
          status: (Number(rows[0].featured ?? 0) === 1 ? 'published' : 'draft') as 'published' | 'draft',
          is_featured: Number(rows[0].featured ?? 0) === 1 ? 1 : 0,
        }
      : null;
    return apiEnvelope(true, { status: 201, data: item, message: 'Article created' });
  } catch (error) {
    console.error('[api/admin/news][POST] Unexpected error:', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Unexpected error',
      message: 'Failed to create article',
    });
  }
}
