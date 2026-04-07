import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    const body = await request.json();
    const rows = await sql`
      UPDATE gallery
      SET title = ${body.title},
          description = ${body.description},
          image_url = ${body.image_url},
          category = ${body.category},
          tags = ${body.tags ?? null},
          photographer = ${body.photographer ?? null},
          location = ${body.location ?? null},
          event_date = ${body.event_date ?? null},
          file_size = ${body.file_size ?? null},
          dimensions = ${body.dimensions ?? null},
          status = ${body.status},
          featured = ${body.featured ?? false},
          alt_text = ${body.alt_text ?? null},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${Number(id)}
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
    await sql`DELETE FROM gallery WHERE id = ${Number(id)}`;
    return NextResponse.json({ data: true });
  } catch (error) {
    console.error('[api/admin/gallery][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
