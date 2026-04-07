import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const parseStoredMessage = (value: string) => {
  if (value.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(value) as {
        subject?: string;
        phone?: string | null;
        status?: 'new' | 'in_progress' | 'resolved' | 'archived';
        admin_notes?: string | null;
        responded_at?: string | null;
        message?: string;
      };

      return {
        subject: parsed.subject ?? '',
        phone: parsed.phone ?? null,
        status: parsed.status ?? 'new',
        admin_notes: parsed.admin_notes ?? null,
        responded_at: parsed.responded_at ?? null,
        message: parsed.message ?? '',
      };
    } catch {
      // Fall through to legacy parsing.
    }
  }

  const lines = value.split(/\r?\n/);
  let subject = '';
  let phone: string | null = null;
  let bodyStart = 0;

  if (lines[0]?.startsWith('Subject: ')) {
    subject = lines[0].slice('Subject: '.length).trim();
    bodyStart = 1;
  }

  if (lines[1]?.startsWith('Phone: ')) {
    phone = lines[1].slice('Phone: '.length).trim() || null;
    bodyStart = 2;
  }

  const message = lines.slice(bodyStart).join('\n').replace(/^\n+/, '').trim();

  return { subject, phone, status: 'new' as const, admin_notes: null, responded_at: null, message };
};

const mapContactRow = (row: {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}) => {
  const parsed = parseStoredMessage(row.message);

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: parsed.phone,
    subject: parsed.subject,
    message: parsed.message,
    status: parsed.status,
    admin_notes: parsed.admin_notes,
    responded_at: parsed.responded_at,
    created_at: row.created_at,
    updated_at: row.created_at,
  };
};

export async function GET() {
  try {
    await requireAdmin();

    const rows = await sql<{
      id: number;
      name: string;
      email: string;
      message: string;
      created_at: string;
    }[]>`
      SELECT id, name, email, message, created_at
      FROM contact_messages
      ORDER BY created_at DESC
      LIMIT 15
    `;

    return NextResponse.json({ data: rows.map(mapContactRow) }, { status: 200 });
  } catch (error) {
    console.error('[api/admin/contact][GET] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

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
      email: string;
      message: string;
      created_at: string;
    }[]>`
      SELECT id, name, email, message, created_at
      FROM contact_messages
      WHERE id = ${id}
      LIMIT 1
    `;

    const row = rows[0];

    if (!row) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const parsed = parseStoredMessage(row.message);
    const nextMessage = JSON.stringify({
      subject: parsed.subject,
      phone: parsed.phone,
      status,
      admin_notes: updates?.admin_notes ?? parsed.admin_notes,
      responded_at: updates?.responded_at ?? (status === 'resolved' ? new Date().toISOString() : parsed.responded_at),
      message: parsed.message,
    });

    await sql`
      UPDATE contact_messages
      SET message = ${nextMessage}
      WHERE id = ${id}
    `;

    return NextResponse.json(
      {
        data: mapContactRow({
          ...row,
          message: nextMessage,
        }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[api/admin/contact][PATCH] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();

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