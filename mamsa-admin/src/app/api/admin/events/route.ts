import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  await requireAdmin();

  try {
    const rows = await sql`
      SELECT *
      FROM events
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('[api/admin/events][GET] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const rows = await sql`
      INSERT INTO events (title, description, date, time, location, status, featured_image, capacity, registration_required, registration_deadline, organizer, contact_email, contact_phone, tags, created_by)
      VALUES (${body.title}, ${body.description}, ${body.date}, ${body.time ?? null}, ${body.location}, ${body.status}, ${body.featured_image ?? null}, ${body.capacity ?? null}, ${body.registration_required ?? false}, ${body.registration_deadline ?? null}, ${body.organizer}, ${body.contact_email ?? null}, ${body.contact_phone ?? null}, ${body.tags ?? null}, ${body.created_by ?? null})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/events][POST] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
