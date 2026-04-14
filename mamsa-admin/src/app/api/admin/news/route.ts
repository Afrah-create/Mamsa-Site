import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';
import { toMysqlJsonArray } from '@/lib/mysql-json';
import { isBase64Image } from '@/lib/upload';
import { saveImage } from '@/lib/upload-server';

const allowedCategories = new Set(['general', 'events', 'announcements']);

export async function GET() {
  await requireAdmin();

  try {
    const rows = await sql`
      SELECT *
      FROM news
      ORDER BY date DESC
    `;

    const data = rows.map((row) => ({ ...row, featured_image: row.image, status: 'published' as const }));
    return NextResponse.json({ data });
  } catch (error) {
    console.error('[api/admin/news][GET] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();

    const title = String(body.title ?? '').trim();
    const content = String(body.content ?? '').trim();
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const category = allowedCategories.has(String(body.category ?? '').trim())
      ? String(body.category).trim()
      : 'general';

    const imageValue = body.image ?? body.featured_image ?? null;
    const image = isBase64Image(imageValue) ? await saveImage(imageValue, 'news') : imageValue;

    const tagsJson = toMysqlJsonArray(body.tags);
    const insertId = await insertAndGetId`
      INSERT INTO news (title, excerpt, content, category, date, image, featured, author, tags, updated_at)
      VALUES (${title}, ${body.excerpt ?? null}, ${content}, ${category}, ${body.date ?? new Date().toISOString()}, ${image}, ${body.featured ?? false}, ${body.author ?? 'Admin'}, ${tagsJson}, NOW())
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT *
      FROM news
      WHERE id = ${insertId}
      LIMIT 1
    `;

    return NextResponse.json({ data: { ...rows[0], featured_image: rows[0]?.image, status: 'published' } }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/news][POST] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
