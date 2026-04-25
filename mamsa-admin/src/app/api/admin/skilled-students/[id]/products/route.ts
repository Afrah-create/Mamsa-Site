import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';
import { apiEnvelope } from '@/lib/api-envelope';
import { isBase64Image } from '@/lib/upload';
import { saveImage } from '@/lib/upload-server';

type ProductRow = {
  id: number;
  student_id: number;
  name: string;
  description: string | null;
  price: string | number | null;
  currency: string;
  image_url: string | null;
  category: string | null;
  is_available: number;
  is_featured: number;
  display_order: number;
  created_at: string;
  updated_at: string | null;
};

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await context.params;
    const studentId = Number(id);
    if (!Number.isFinite(studentId)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid student id', message: 'Validation failed' });
    }

    const student = await sql<{ id: number }[]>`
      SELECT id FROM skilled_students WHERE id = ${studentId} LIMIT 1
    `;
    if (!student[0]) {
      return apiEnvelope(false, { status: 404, error: 'Student not found', message: 'Not found' });
    }

    const rows = await sql<ProductRow[]>`
      SELECT *
      FROM student_products
      WHERE student_id = ${studentId}
      ORDER BY display_order ASC, created_at DESC
    `;

    return apiEnvelope(true, { data: rows, message: 'Products loaded' });
  } catch (error) {
    console.error('[api/admin/skilled-students/[id]/products][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load products',
    });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await context.params;
    const studentId = Number(id);
    if (!Number.isFinite(studentId)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid student id', message: 'Validation failed' });
    }

    const student = await sql<{ id: number }[]>`
      SELECT id FROM skilled_students WHERE id = ${studentId} LIMIT 1
    `;
    if (!student[0]) {
      return apiEnvelope(false, { status: 404, error: 'Student not found', message: 'Not found' });
    }

    const body = await request.json();
    const name = String(body.name ?? '').trim();
    if (!name) {
      return apiEnvelope(false, { status: 400, error: 'name is required', message: 'Validation failed' });
    }

    const priceRaw = body.price;
    const hasPrice = priceRaw !== null && priceRaw !== undefined && String(priceRaw).trim() !== '';
    const price = hasPrice ? Number(priceRaw) : null;
    if (hasPrice && (!Number.isFinite(price) || (price as number) < 0)) {
      return apiEnvelope(false, { status: 400, error: 'price must be a valid non-negative number', message: 'Validation failed' });
    }

    const currency = String(body.currency ?? 'UGX').trim().slice(0, 8) || 'UGX';
    const displayOrder = Number(body.display_order ?? body.displayOrder ?? 0);
    const isAvailable = Number(body.is_available ?? body.isAvailable ?? 1) ? 1 : 0;
    const isFeatured = Number(body.is_featured ?? body.isFeatured ?? 0) ? 1 : 0;

    let imageUrl: string | null = body.image_url ?? body.imageUrl ?? null;
    if (isBase64Image(imageUrl)) {
      imageUrl = await saveImage(imageUrl as string, 'student-products');
    } else if (imageUrl != null) {
      imageUrl = String(imageUrl).trim() || null;
    }

    const insertId = await insertAndGetId`
      INSERT INTO student_products (
        student_id, name, description, price, currency, image_url, category, is_available, is_featured, display_order
      )
      VALUES (
        ${studentId},
        ${name},
        ${body.description ?? null},
        ${price},
        ${currency},
        ${imageUrl},
        ${body.category ?? null},
        ${isAvailable},
        ${isFeatured},
        ${Number.isFinite(displayOrder) ? displayOrder : 0}
      )
    `;

    const rows = await sql<ProductRow[]>`
      SELECT *
      FROM student_products
      WHERE id = ${insertId}
      LIMIT 1
    `;

    return apiEnvelope(true, { status: 201, data: rows[0], message: 'Product created' });
  } catch (error) {
    console.error('[api/admin/skilled-students/[id]/products][POST]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to create product',
    });
  }
}
