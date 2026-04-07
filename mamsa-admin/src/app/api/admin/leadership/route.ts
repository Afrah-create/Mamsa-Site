import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  await requireAdmin();

  try {
    const rows = await sql`
      SELECT *
      FROM leadership
      ORDER BY order_position ASC, created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('[api/admin/leadership][GET] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const rows = await sql`
      INSERT INTO leadership (name, position, bio, image_url, email, phone, department, year, social_links, status, order_position, created_by)
      VALUES (${body.name}, ${body.position}, ${body.bio}, ${body.image_url}, ${body.email ?? null}, ${body.phone ?? null}, ${body.department ?? null}, ${body.year ?? null}, ${body.social_links ?? null}, ${body.status}, ${body.order_position ?? 0}, ${body.created_by ?? null})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/leadership][POST] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
