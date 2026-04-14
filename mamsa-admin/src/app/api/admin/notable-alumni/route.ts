import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';
import { toMysqlJson } from '@/lib/mysql-json';
import { isBase64Image } from '@/lib/upload';
import { saveImage } from '@/lib/upload-server';
import { apiEnvelope } from '@/lib/api-envelope';

export async function GET(request: Request) {
  await requireAdmin();

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20') || 20));
    const offset = (page - 1) * limit;
    const search = searchParams.get('search')?.trim() ?? '';
    const like = search ? `%${search}%` : null;

    const countRows = await sql<{ total: number }[]>`
      SELECT COUNT(*) AS total
      FROM notable_alumni
      WHERE 1 = 1
        ${like
          ? sql`AND (
            full_name LIKE ${like}
            OR COALESCE(current_position,'') LIKE ${like}
            OR COALESCE(organization,'') LIKE ${like}
            OR COALESCE(specialty,'') LIKE ${like}
          )`
          : sql``}
    `;
    const total = Number(countRows[0]?.total ?? 0);

    const rows = await sql<Record<string, unknown>[]>`
      SELECT *
      FROM notable_alumni
      WHERE 1 = 1
        ${like
          ? sql`AND (
            full_name LIKE ${like}
            OR COALESCE(current_position,'') LIKE ${like}
            OR COALESCE(organization,'') LIKE ${like}
            OR COALESCE(specialty,'') LIKE ${like}
          )`
          : sql``}
      ORDER BY order_position ASC, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return apiEnvelope(true, {
      data: {
        items: rows,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
      message: 'Notable alumni loaded',
    });
  } catch (error) {
    console.error('[api/admin/notable-alumni][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load notable alumni',
    });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const fullName = String(body.full_name ?? '').trim();
    if (!fullName) {
      return apiEnvelope(false, {
        status: 400,
        error: 'full_name is required',
        message: 'Validation failed',
      });
    }

    const imageVal = body.image ?? body.image_url ?? null;
    let imageUrl: string | null = imageVal;
    if (isBase64Image(imageVal)) {
      try {
        imageUrl = await saveImage(imageVal as string, 'alumni');
      } catch (e) {
        return apiEnvelope(false, {
          status: 500,
          error: e instanceof Error ? e.message : 'Image upload failed',
          message: 'Image upload error',
        });
      }
    }

    const profession =
      body.profession !== undefined ? body.profession : body.current_position ?? null;
    const achievementText = body.achievement ?? body.achievements ?? null;
    const bioText = body.bio ?? body.biography ?? null;
    const featured = Number(body.is_featured ?? body.featured ?? 0) ? 1 : 0;
    const status = body.status != null ? String(body.status) : 'draft';
    const orderPosition = Number(body.order_position ?? 0) || 0;
    const profileLinksJson = toMysqlJson(body.profile_links ?? null);

    const insertId = await insertAndGetId`
      INSERT INTO notable_alumni (
        full_name, slug, graduation_year, biography, achievements, current_position,
        organization, specialty, image_url, profile_links, featured, status, order_position
      )
      VALUES (
        ${fullName},
        ${body.slug ?? null},
        ${body.graduation_year ?? null},
        ${bioText},
        ${achievementText},
        ${profession},
        ${body.organization ?? null},
        ${body.specialty ?? null},
        ${imageUrl},
        ${profileLinksJson},
        ${featured},
        ${status},
        ${orderPosition}
      )
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT * FROM notable_alumni WHERE id = ${insertId} LIMIT 1
    `;

    return apiEnvelope(true, { status: 201, data: rows[0], message: 'Alumni created' });
  } catch (error) {
    console.error('[api/admin/notable-alumni][POST]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to create alumni',
    });
  }
}
