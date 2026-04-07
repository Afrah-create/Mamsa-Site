import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  await requireAdmin();

  try {
    const rows = await sql`
      SELECT *
      FROM news_articles
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('[api/admin/news][GET] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const rows = await sql`
      INSERT INTO news_articles (title, content, author, status, featured_image, excerpt, tags, published_at, created_by)
      VALUES (${body.title}, ${body.content}, ${body.author}, ${body.status}, ${body.featured_image ?? null}, ${body.excerpt ?? null}, ${body.tags ?? null}, ${body.status === 'published' ? new Date().toISOString() : null}, ${body.created_by ?? null})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/news][POST] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
