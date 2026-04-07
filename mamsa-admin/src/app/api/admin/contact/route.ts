import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  await requireAdmin();

  try {
    const rows = await sql<{
      id: number;
      name: string;
      subject: string | null;
      status: 'new' | 'in_progress' | 'resolved' | 'archived';
      created_at: string;
      updated_at: string | null;
    }[]>`
      SELECT id, name, subject, status, created_at, updated_at
      FROM contact_messages
      ORDER BY created_at DESC
      LIMIT 15
    `;

    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (error) {
    console.error('[api/admin/contact][GET] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  await requireAdmin();

  try {
    const { id, status, updates } = (await request.json()) as {
      id: number;
      status: 'new' | 'in_progress' | 'resolved' | 'archived';
      updates?: {
        admin_notes?: string | null;
        responded_at?: string | null;
      };
    };

    const rows = await sql<{
      id: number;
      name: string;
      subject: string | null;
      status: 'new' | 'in_progress' | 'resolved' | 'archived';
      created_at: string;
      updated_at: string | null;
    }[]>`
      UPDATE contact_messages
      SET status = ${status},
          admin_notes = ${updates?.admin_notes ?? null},
          responded_at = ${updates?.responded_at ?? null},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING id, name, subject, status, created_at, updated_at
    `;

    return NextResponse.json({ data: rows[0] ?? null }, { status: 200 });
  } catch (error) {
    console.error('[api/admin/contact][PATCH] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  await requireAdmin();

  try {
    const { id } = (await request.json()) as { id: number };

    await sql`DELETE FROM contact_messages WHERE id = ${id}`;

    return NextResponse.json({ data: true }, { status: 200 });
  } catch (error) {
    console.error('[api/admin/contact][DELETE] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}