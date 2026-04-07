import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    const body = await request.json();
    const rows = await sql`
      UPDATE leadership
      SET name = ${body.name},
          position = ${body.position},
          bio = ${body.bio},
          image_url = ${body.image_url},
          email = ${body.email ?? null},
          phone = ${body.phone ?? null},
          department = ${body.department ?? null},
          year = ${body.year ?? null},
          social_links = ${body.social_links ?? null},
          status = ${body.status},
          order_position = ${body.order_position ?? 0},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${Number(id)}
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] ?? null });
  } catch (error) {
    console.error('[api/admin/leadership][PATCH] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    await sql`DELETE FROM leadership WHERE id = ${Number(id)}`;
    return NextResponse.json({ data: true });
  } catch (error) {
    console.error('[api/admin/leadership][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
