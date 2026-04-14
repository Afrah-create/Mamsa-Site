import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';
import { toMysqlJson } from '@/lib/mysql-json';
import { isBase64Image } from '@/lib/upload';
import { saveImage } from '@/lib/upload-server';
import { apiEnvelope } from '@/lib/api-envelope';

export async function GET() {
  await requireAdmin();

  try {
    const rows = await sql<Record<string, unknown>[]>`
      SELECT *
      FROM leadership
      ORDER BY order_position ASC, created_at DESC
    `;

    return apiEnvelope(true, { data: { items: rows }, message: 'Leadership loaded' });
  } catch (error) {
    console.error('[api/admin/leadership][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load leadership',
    });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const name = String(body.name ?? body.full_name ?? '').trim();
    if (!name) {
      return apiEnvelope(false, {
        status: 400,
        error: 'name is required',
        message: 'Validation failed',
      });
    }

    const imageVal = body.image ?? body.image_url ?? null;
    let imageUrl: string | null = imageVal;
    if (isBase64Image(imageVal)) {
      try {
        imageUrl = await saveImage(imageVal as string, 'leadership');
      } catch (e) {
        return apiEnvelope(false, {
          status: 500,
          error: e instanceof Error ? e.message : 'Image upload failed',
          message: 'Image upload error',
        });
      }
    }

    const position = body.position ?? body.title ?? null;
    const socialLinksJson = toMysqlJson(body.social_links ?? null);
    const orderPosition = Number(body.order_position ?? body.display_order ?? 0) || 0;
    const statusFinal =
      body.status != null
        ? String(body.status)
        : body.is_active === 0 || body.is_active === false || body.is_active === '0'
          ? 'inactive'
          : 'active';

    const insertId = await insertAndGetId`
      INSERT INTO leadership (
        name, position, bio, image_url, email, phone, department, year, social_links,
        status, order_position, created_by, updated_by
      )
      VALUES (
        ${name},
        ${position},
        ${body.bio ?? null},
        ${imageUrl},
        ${body.email ?? null},
        ${body.phone ?? null},
        ${body.department ?? null},
        ${body.year ?? null},
        ${socialLinksJson},
        ${statusFinal},
        ${orderPosition},
        ${body.created_by ?? null},
        ${body.updated_by ?? null}
      )
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT * FROM leadership WHERE id = ${insertId} LIMIT 1
    `;

    return apiEnvelope(true, { status: 201, data: rows[0], message: 'Leadership member created' });
  } catch (error) {
    console.error('[api/admin/leadership][POST]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to create member',
    });
  }
}
