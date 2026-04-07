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
    const { id, status } = (await request.json()) as {
      id: number;
      status: 'new' | 'in_progress' | 'resolved' | 'archived';
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
      SET status = ${status}
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