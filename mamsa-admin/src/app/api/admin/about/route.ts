import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { apiEnvelope } from '@/lib/api-envelope';

export async function GET() {
  await requireAdmin();

  try {
    const rows = await sql<{ section: string; content: string | null; updated_at: string | null }[]>`
      SELECT section, content, updated_at
      FROM about
      ORDER BY section ASC
    `;

    const sections: Record<string, string> = {};
    for (const r of rows) {
      sections[r.section] = r.content ?? '';
    }

    return apiEnvelope(true, { data: { sections, rows }, message: 'About content loaded' });
  } catch (error) {
    console.error('[api/admin/about][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load about',
    });
  }
}

export async function PUT(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const sections =
      (body.sections as Record<string, string> | undefined) ??
      (typeof body === 'object' && body !== null && !Array.isArray(body) && !body.sections
        ? (body as Record<string, string>)
        : null);

    if (!sections || typeof sections !== 'object') {
      return apiEnvelope(false, {
        status: 400,
        error: 'sections object required',
        message: 'Validation failed',
      });
    }

    const now = new Date().toISOString();
    for (const [section, content] of Object.entries(sections)) {
      if (typeof section !== 'string' || !section.trim()) continue;
      const text = content == null ? '' : String(content);
      await sql`
        INSERT INTO about (section, content, updated_at)
        VALUES (${section.trim()}, ${text}, ${now})
        ON DUPLICATE KEY UPDATE
          content = VALUES(content),
          updated_at = VALUES(updated_at)
      `;
    }

    const rows = await sql<{ section: string; content: string | null; updated_at: string | null }[]>`
      SELECT section, content, updated_at
      FROM about
      ORDER BY section ASC
    `;

    const out: Record<string, string> = {};
    for (const r of rows) {
      out[r.section] = r.content ?? '';
    }

    return apiEnvelope(true, { data: { sections: out, rows }, message: 'About content saved' });
  } catch (error) {
    console.error('[api/admin/about][PUT]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to save about',
    });
  }
}
