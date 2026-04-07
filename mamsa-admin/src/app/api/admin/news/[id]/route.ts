import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    const body = await request.json();
    const rows = await sql`
      UPDATE news_articles
      SET title = ${body.title},
          content = ${body.content},
          author = ${body.author},
          status = ${body.status},
          featured_image = ${body.featured_image ?? null},
          excerpt = ${body.excerpt ?? null},
          tags = ${body.tags ?? null},
          published_at = ${body.published_at ?? null},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${Number(id)}
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] ?? null });
  } catch (error) {
    console.error('[api/admin/news][PATCH] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    await sql`DELETE FROM news_articles WHERE id = ${Number(id)}`;
    return NextResponse.json({ data: true });
  } catch (error) {
    console.error('[api/admin/news][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
