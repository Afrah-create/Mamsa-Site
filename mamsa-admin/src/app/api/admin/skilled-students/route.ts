import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';
import { toMysqlJson } from '@/lib/mysql-json';
import { isBase64Image } from '@/lib/upload';
import { saveImage } from '@/lib/upload-server';
import { apiEnvelope } from '@/lib/api-envelope';

const latestPaymentJoin = sql`
  LEFT JOIN (
    SELECT * FROM (
      SELECT
        p.*,
        ROW_NUMBER() OVER (
          PARTITION BY p.student_id
          ORDER BY p.payment_date DESC, p.id DESC
        ) AS rn
      FROM student_payments p
    ) z
    WHERE z.rn = 1
  ) lp ON lp.student_id = s.id
`;

export async function GET(request: Request) {
  await requireAdmin();

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20') || 20));
    const offset = (page - 1) * limit;
    const search = searchParams.get('search')?.trim() ?? '';
    const category = searchParams.get('category')?.trim() ?? '';
    const paymentStatus = searchParams.get('payment_status')?.trim().toLowerCase() ?? '';
    const isActiveParam = searchParams.get('is_active');

    const like = search ? `%${search}%` : null;

    const categoryOk = category === 'skill' || category === 'business' ? category : null;
    const paymentOk =
      paymentStatus === 'active' || paymentStatus === 'expired' || paymentStatus === 'pending' || paymentStatus === 'none'
        ? paymentStatus
        : paymentStatus === 'all' || paymentStatus === ''
          ? null
          : null;

    let isActiveFilter: 0 | 1 | null = null;
    if (isActiveParam === '0' || isActiveParam === '1') {
      isActiveFilter = Number(isActiveParam) as 0 | 1;
    }

    const countRows = await sql<{ total: number }[]>`
      SELECT COUNT(*) AS total
      FROM skilled_students s
      ${latestPaymentJoin}
      WHERE 1 = 1
        ${like ? sql`AND (s.full_name LIKE ${like} OR s.email LIKE ${like} OR s.title LIKE ${like})` : sql``}
        ${categoryOk ? sql`AND s.category = ${categoryOk}` : sql``}
        ${paymentOk === 'none' ? sql`AND lp.id IS NULL` : sql``}
        ${paymentOk && paymentOk !== 'none' ? sql`AND lp.status = ${paymentOk}` : sql``}
        ${isActiveFilter !== null ? sql`AND s.is_active = ${isActiveFilter}` : sql``}
    `;

    const total = Number(countRows[0]?.total ?? 0);

    const rows = await sql<Record<string, unknown>[]>`
      SELECT
        s.*,
        lp.id AS latest_payment_id,
        lp.status AS latest_payment_status,
        lp.expiry_date AS latest_payment_expiry,
        lp.amount AS latest_payment_amount,
        lp.currency AS latest_payment_currency,
        lp.payment_date AS latest_payment_date
      FROM skilled_students s
      ${latestPaymentJoin}
      WHERE 1 = 1
        ${like ? sql`AND (s.full_name LIKE ${like} OR s.email LIKE ${like} OR s.title LIKE ${like})` : sql``}
        ${categoryOk ? sql`AND s.category = ${categoryOk}` : sql``}
        ${paymentOk === 'none' ? sql`AND lp.id IS NULL` : sql``}
        ${paymentOk && paymentOk !== 'none' ? sql`AND lp.status = ${paymentOk}` : sql``}
        ${isActiveFilter !== null ? sql`AND s.is_active = ${isActiveFilter}` : sql``}
      ORDER BY s.created_at DESC
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
      message: 'Skilled students loaded',
    });
  } catch (error) {
    console.error('[api/admin/skilled-students][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load skilled students',
    });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const fullName = String(body.full_name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const category = String(body.category ?? '').trim().toLowerCase();
    const title = String(body.title ?? '').trim();

    if (!fullName || !email || !title) {
      return apiEnvelope(false, {
        status: 400,
        error: 'full_name, email, and title are required',
        message: 'Validation failed',
      });
    }

    if (category !== 'skill' && category !== 'business') {
      return apiEnvelope(false, {
        status: 400,
        error: "category must be 'skill' or 'business'",
        message: 'Validation failed',
      });
    }

    let profileImage: string | null = body.profile_image ?? body.profileImage ?? null;
    if (isBase64Image(profileImage)) {
      try {
        profileImage = await saveImage(profileImage as string, 'students');
      } catch (e) {
        console.error('[api/admin/skilled-students][POST] Image upload failed', e);
        return apiEnvelope(false, {
          status: 500,
          error: e instanceof Error ? e.message : 'Image upload failed',
          message: 'Image upload error',
        });
      }
    }

    const socialJson = toMysqlJson(body.social_links ?? null);

    const insertId = await insertAndGetId`
      INSERT INTO skilled_students (
        full_name, email, phone, profile_image, bio, category, title, description,
        location, website_url, social_links, is_active, is_featured
      )
      VALUES (
        ${fullName},
        ${email},
        ${body.phone ?? null},
        ${profileImage},
        ${body.bio ?? null},
        ${category},
        ${title},
        ${body.description ?? null},
        ${body.location ?? null},
        ${body.website_url ?? body.websiteUrl ?? null},
        ${socialJson},
        ${body.is_active ?? body.isActive ?? 0},
        ${body.is_featured ?? body.isFeatured ?? 0}
      )
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT * FROM skilled_students WHERE id = ${insertId} LIMIT 1
    `;

    return apiEnvelope(true, {
      status: 201,
      data: rows[0],
      message: 'Skilled student created',
    });
  } catch (error) {
    console.error('[api/admin/skilled-students][POST]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to create skilled student',
    });
  }
}
