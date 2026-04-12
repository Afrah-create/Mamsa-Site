import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';
import { toMysqlJson } from '@/lib/mysql-json';
import { apiEnvelope } from '@/lib/api-envelope';

type ContactRow = {
  id: number;
  phone: string | null;
  email: string | null;
  address: string | null;
  office_hours: string | null;
  social_media: unknown;
  updated_at: string | null;
};

export async function GET() {
  await requireAdmin();

  try {
    const rows = await sql<ContactRow[]>`
      SELECT id, phone, email, address, office_hours, social_media, updated_at
      FROM contact
      ORDER BY id ASC
      LIMIT 1
    `;

    return apiEnvelope(true, {
      data: rows[0] ?? null,
      message: 'Contact row loaded',
    });
  } catch (error) {
    console.error('[api/admin/contact][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load contact',
    });
  }
}

export async function PUT(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const phone = body.phone ?? null;
    const email = body.email ?? null;
    const address = body.address ?? null;
    const officeHours = body.office_hours ?? body.officeHours ?? null;
    const socialRaw = body.social_media ?? body.socialMedia ?? null;
    const socialJson = toMysqlJson(socialRaw);

    const existing = await sql<{ id: number }[]>`
      SELECT id FROM contact ORDER BY id ASC LIMIT 1
    `;

    if (existing[0]) {
      await sql`
        UPDATE contact
        SET
          phone = ${phone},
          email = ${email},
          address = ${address},
          office_hours = ${officeHours},
          social_media = ${socialJson},
          updated_at = ${new Date().toISOString()}
        WHERE id = ${existing[0].id}
      `;
      const rows = await sql<ContactRow[]>`
        SELECT id, phone, email, address, office_hours, social_media, updated_at
        FROM contact WHERE id = ${existing[0].id} LIMIT 1
      `;
      return apiEnvelope(true, { data: rows[0] ?? null, message: 'Contact updated' });
    }

    const insertId = await insertAndGetId`
      INSERT INTO contact (phone, email, address, office_hours, social_media, updated_at)
      VALUES (${phone}, ${email}, ${address}, ${officeHours}, ${socialJson}, ${new Date().toISOString()})
    `;
    const rows = await sql<ContactRow[]>`
      SELECT id, phone, email, address, office_hours, social_media, updated_at
      FROM contact WHERE id = ${insertId} LIMIT 1
    `;
    return apiEnvelope(true, { status: 201, data: rows[0] ?? null, message: 'Contact created' });
  } catch (error) {
    console.error('[api/admin/contact][PUT]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to save contact',
    });
  }
}
