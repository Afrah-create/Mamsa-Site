import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { toMysqlJson } from '@/lib/mysql-json';
import { deleteImage, isBase64Image, isLocalUploadPath, saveImage } from '@/lib/upload';
import { apiEnvelope } from '@/lib/api-envelope';

type LeadershipRow = {
  id: number;
  name: string;
  position: string | null;
  bio: string | null;
  image_url: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  year: string | null;
  social_links: unknown;
  status: string;
  order_position: number;
  created_by: string | null;
  updated_by: string | null;
};

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid id', message: 'Validation failed' });
    }

    const rows = await sql<Record<string, unknown>[]>`
      SELECT * FROM leadership WHERE id = ${numericId} LIMIT 1
    `;
    if (!rows[0]) {
      return apiEnvelope(false, { status: 404, error: 'Not found', message: 'Member not found' });
    }

    return apiEnvelope(true, { data: rows[0], message: 'Member loaded' });
  } catch (error) {
    console.error('[api/admin/leadership/[id]][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load member',
    });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid id', message: 'Validation failed' });
    }

    const existingRows = await sql<LeadershipRow[]>`
      SELECT * FROM leadership WHERE id = ${numericId} LIMIT 1
    `;
    const existing = existingRows[0];
    if (!existing) {
      return apiEnvelope(false, { status: 404, error: 'Not found', message: 'Member not found' });
    }

    const body = await request.json();
    const imageVal = body.image ?? body.image_url;

    let imageUrl: string | null = existing.image_url;
    if (isBase64Image(imageVal)) {
      try {
        if (isLocalUploadPath(existing.image_url)) {
          await deleteImage(existing.image_url);
        }
        imageUrl = await saveImage(imageVal as string, 'leadership');
      } catch (e) {
        return apiEnvelope(false, {
          status: 500,
          error: e instanceof Error ? e.message : 'Image upload failed',
          message: 'Image upload error',
        });
      }
    } else if (imageVal !== undefined && imageVal !== null && !isBase64Image(imageVal)) {
      imageUrl = String(imageVal);
    }

    const name =
      body.name !== undefined || body.full_name !== undefined
        ? String(body.name ?? body.full_name).trim()
        : existing.name;
    if (!name) {
      return apiEnvelope(false, { status: 400, error: 'name is required', message: 'Validation failed' });
    }

    const position =
      body.position !== undefined || body.title !== undefined
        ? (body.position ?? body.title)
        : existing.position;
    const bio = body.bio !== undefined ? body.bio : existing.bio;
    const email = body.email !== undefined ? body.email : existing.email;
    const phone = body.phone !== undefined ? body.phone : existing.phone;
    const department = body.department !== undefined ? body.department : existing.department;
    const year = body.year !== undefined ? body.year : existing.year;
    const socialLinksJson = toMysqlJson(
      body.social_links !== undefined ? body.social_links : existing.social_links,
    );
    let status = body.status !== undefined ? String(body.status) : existing.status;
    if (body.is_active !== undefined) {
      const a = body.is_active;
      status = a === 0 || a === false || a === '0' ? 'inactive' : 'active';
    }
    const orderPosition =
      body.order_position !== undefined || body.display_order !== undefined
        ? Number(body.order_position ?? body.display_order) || 0
        : existing.order_position;
    const updatedBy = body.updated_by !== undefined ? body.updated_by : existing.updated_by;

    await sql`
      UPDATE leadership
      SET
        name = ${name},
        position = ${position},
        bio = ${bio},
        image_url = ${imageUrl},
        email = ${email},
        phone = ${phone},
        department = ${department},
        year = ${year},
        social_links = ${socialLinksJson},
        status = ${status},
        order_position = ${orderPosition},
        updated_by = ${updatedBy},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${numericId}
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT * FROM leadership WHERE id = ${numericId} LIMIT 1
    `;

    return apiEnvelope(true, { data: rows[0], message: 'Member updated' });
  } catch (error) {
    console.error('[api/admin/leadership/[id]][PUT]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to update member',
    });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid id', message: 'Validation failed' });
    }

    const existing = await sql<{ image_url: string | null }[]>`
      SELECT image_url FROM leadership WHERE id = ${numericId} LIMIT 1
    `;
    if (!existing[0]) {
      return apiEnvelope(false, { status: 404, error: 'Not found', message: 'Member not found' });
    }

    try {
      await deleteImage(existing[0].image_url);
    } catch (e) {
      console.warn('[api/admin/leadership/[id]][DELETE] deleteImage', e);
    }

    await sql`DELETE FROM leadership WHERE id = ${numericId}`;

    return apiEnvelope(true, { data: { id: numericId, deleted: true }, message: 'Member deleted' });
  } catch (error) {
    console.error('[api/admin/leadership/[id]][DELETE]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to delete member',
    });
  }
}
