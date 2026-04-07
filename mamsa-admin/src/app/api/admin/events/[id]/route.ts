import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    const body = await request.json();
    const rows = await sql`
      UPDATE events
      SET title = ${body.title},
          description = ${body.description},
          date = ${body.date},
          time = ${body.time ?? null},
          location = ${body.location},
          status = ${body.status},
          featured_image = ${body.featured_image ?? null},
          capacity = ${body.capacity ?? null},
          registration_required = ${body.registration_required ?? false},
          registration_deadline = ${body.registration_deadline ?? null},
          organizer = ${body.organizer},
          contact_email = ${body.contact_email ?? null},
          contact_phone = ${body.contact_phone ?? null},
          tags = ${body.tags ?? null},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${Number(id)}
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] ?? null });
  } catch (error) {
    console.error('[api/admin/events][PATCH] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    await sql`DELETE FROM events WHERE id = ${Number(id)}`;
    return NextResponse.json({ data: true });
  } catch (error) {
    console.error('[api/admin/events][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
