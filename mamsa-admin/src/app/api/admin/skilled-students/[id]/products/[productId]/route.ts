import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { apiEnvelope } from '@/lib/api-envelope';
import { isBase64Image, isLocalUploadPath } from '@/lib/upload';
import { deleteImage, saveImage } from '@/lib/upload-server';

type ProductRow = {
  id: number;
  student_id: number;
  image_url: string | null;
};

async function getProduct(studentId: number, productId: number) {
  const rows = await sql<ProductRow[]>`
    SELECT id, student_id, image_url
    FROM student_products
    WHERE id = ${productId} AND student_id = ${studentId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function PUT(request: Request, context: { params: Promise<{ id: string; productId: string }> }) {
  await requireAdmin();

  try {
    const { id, productId } = await context.params;
    const studentId = Number(id);
    const numericProductId = Number(productId);
    if (!Number.isFinite(studentId) || !Number.isFinite(numericProductId)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid id', message: 'Validation failed' });
    }

    const existing = await getProduct(studentId, numericProductId);
    if (!existing) {
      return apiEnvelope(false, { status: 404, error: 'Product not found', message: 'Not found' });
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

    let imageUrl: string | null = body.image_url ?? body.imageUrl ?? existing.image_url ?? null;
    if (isBase64Image(imageUrl)) {
      if (isLocalUploadPath(existing.image_url)) {
        await deleteImage(existing.image_url);
      }
      imageUrl = await saveImage(imageUrl as string, 'student-products');
    } else if (imageUrl != null) {
      imageUrl = String(imageUrl).trim() || null;
    }

    const currency = String(body.currency ?? 'UGX').trim().slice(0, 8) || 'UGX';
    const isAvailable = Number(body.is_available ?? body.isAvailable ?? 1) ? 1 : 0;
    const isFeatured = Number(body.is_featured ?? body.isFeatured ?? 0) ? 1 : 0;
    const displayOrderRaw = Number(body.display_order ?? body.displayOrder ?? 0);
    const displayOrder = Number.isFinite(displayOrderRaw) ? displayOrderRaw : 0;

    await sql`
      UPDATE student_products
      SET
        name = ${name},
        description = ${body.description ?? null},
        price = ${price},
        currency = ${currency},
        image_url = ${imageUrl},
        category = ${body.category ?? null},
        is_available = ${isAvailable},
        is_featured = ${isFeatured},
        display_order = ${displayOrder},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${numericProductId} AND student_id = ${studentId}
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT *
      FROM student_products
      WHERE id = ${numericProductId}
      LIMIT 1
    `;

    return apiEnvelope(true, { data: rows[0], message: 'Product updated' });
  } catch (error) {
    console.error('[api/admin/skilled-students/[id]/products/[productId]][PUT]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to update product',
    });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string; productId: string }> }) {
  await requireAdmin();

  try {
    const { id, productId } = await context.params;
    const studentId = Number(id);
    const numericProductId = Number(productId);
    if (!Number.isFinite(studentId) || !Number.isFinite(numericProductId)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid id', message: 'Validation failed' });
    }

    const existing = await getProduct(studentId, numericProductId);
    if (!existing) {
      return apiEnvelope(false, { status: 404, error: 'Product not found', message: 'Not found' });
    }

    if (isLocalUploadPath(existing.image_url)) {
      await deleteImage(existing.image_url);
    }

    await sql`
      DELETE FROM student_products
      WHERE id = ${numericProductId} AND student_id = ${studentId}
    `;

    return apiEnvelope(true, { data: { id: numericProductId, deleted: true }, message: 'Product deleted' });
  } catch (error) {
    console.error('[api/admin/skilled-students/[id]/products/[productId]][DELETE]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to delete product',
    });
  }
}
