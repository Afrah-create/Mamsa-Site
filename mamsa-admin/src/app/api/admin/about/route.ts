import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  await requireAdmin();

  try {
    const rows = await sql<{
      id: number;
      section: string;
      content: string;
      updated_at: string | null;
    }[]>`
      SELECT id, section, content, updated_at
      FROM about
      ORDER BY section ASC
    `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('[api/admin/about][GET] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  await requireAdmin();

  try {
    const body = (await request.json()) as Array<{ section: string; content: string }>;
    const rows = await Promise.all(
      body.map((item) =>
        sql`
          INSERT INTO about (section, content, updated_at)
          VALUES (${item.section}, ${item.content}, ${new Date().toISOString()})
          ON CONFLICT (section)
          DO UPDATE SET content = EXCLUDED.content, updated_at = EXCLUDED.updated_at
          RETURNING id, section, content, updated_at
        `
      )
    );

    return NextResponse.json({ data: rows.flat() });
  } catch (error) {
    console.error('[api/admin/about][PATCH] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
