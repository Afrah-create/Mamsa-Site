import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { toMysqlJson, toMysqlJsonArray } from '@/lib/mysql-json';
import { isBase64Image, isLocalUploadPath } from '@/lib/upload';
import { deleteImage, saveImage } from '@/lib/upload-server';
import { apiEnvelope } from '@/lib/api-envelope';

type GalleryRow = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  tags: unknown;
  photographer: string | null;
  location: string | null;
  event_date: string | null;
  file_size: number | null;
  dimensions: unknown;
  status: string;
  featured: number;
  alt_text: string | null;
  created_by: string | null;
  updated_by: string | null;
};

function parseTags(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

function tagsFromExisting(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p) ? p.map((t) => String(t).trim()).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid id', message: 'Validation failed' });
    }

    const rows = await sql<Record<string, unknown>[]>`
      SELECT * FROM gallery WHERE id = ${numericId} LIMIT 1
    `;
    if (!rows[0]) {
      return apiEnvelope(false, { status: 404, error: 'Not found', message: 'Gallery item not found' });
    }

    return apiEnvelope(true, { data: rows[0], message: 'Gallery item loaded' });
  } catch (error) {
    console.error('[api/admin/gallery/[id]][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load item',
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

    const existingRows = await sql<GalleryRow[]>`
      SELECT * FROM gallery WHERE id = ${numericId} LIMIT 1
    `;
    const existing = existingRows[0];
    if (!existing) {
      return apiEnvelope(false, { status: 404, error: 'Not found', message: 'Gallery item not found' });
    }

    const body = await request.json();
    const imageVal = body.image ?? body.image_url;

    let imageUrl: string | null = existing.image_url;
    if (isBase64Image(imageVal)) {
      try {
        if (isLocalUploadPath(existing.image_url)) {
          await deleteImage(existing.image_url);
        }
        imageUrl = await saveImage(imageVal as string, 'gallery');
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

    const title = body.title !== undefined ? String(body.title).trim() : existing.title;
    const description = body.description !== undefined ? body.description : existing.description;
    const category = body.category !== undefined ? body.category : existing.category;
    const tagsJson =
      body.tags !== undefined
        ? toMysqlJsonArray(parseTags(body.tags))
        : toMysqlJsonArray(tagsFromExisting(existing.tags));
    const photographer = body.photographer !== undefined ? body.photographer : existing.photographer;
    const location = body.location !== undefined ? body.location : existing.location;
    const eventDate = body.event_date !== undefined ? body.event_date : existing.event_date;
    const fileSize = body.file_size !== undefined ? body.file_size : existing.file_size;
    const dimensionsJson =
      body.dimensions !== undefined ? toMysqlJson(body.dimensions) : toMysqlJson(existing.dimensions);
    const status = body.status !== undefined ? String(body.status) : existing.status;
    const featured =
      body.is_featured !== undefined || body.featured !== undefined
        ? Number(body.is_featured ?? body.featured)
        : existing.featured;
    const altText = body.alt_text !== undefined ? body.alt_text : existing.alt_text;
    const updatedBy = body.updated_by !== undefined ? body.updated_by : existing.updated_by;

    await sql`
      UPDATE gallery
      SET
        title = ${title},
        description = ${description},
        image_url = ${imageUrl},
        category = ${category},
        tags = ${tagsJson},
        photographer = ${photographer},
        location = ${location},
        event_date = ${eventDate},
        file_size = ${fileSize},
        dimensions = ${dimensionsJson},
        status = ${status},
        featured = ${featured},
        alt_text = ${altText},
        updated_by = ${updatedBy},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${numericId}
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT * FROM gallery WHERE id = ${numericId} LIMIT 1
    `;

    return apiEnvelope(true, { data: rows[0], message: 'Gallery item updated' });
  } catch (error) {
    console.error('[api/admin/gallery/[id]][PUT]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to update item',
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
      SELECT image_url FROM gallery WHERE id = ${numericId} LIMIT 1
    `;
    if (!existing[0]) {
      return apiEnvelope(false, { status: 404, error: 'Not found', message: 'Gallery item not found' });
    }

    try {
      await deleteImage(existing[0].image_url);
    } catch (e) {
      console.warn('[api/admin/gallery/[id]][DELETE] deleteImage', e);
    }

    await sql`DELETE FROM gallery WHERE id = ${numericId}`;

    return apiEnvelope(true, { data: { id: numericId, deleted: true }, message: 'Gallery item deleted' });
  } catch (error) {
    console.error('[api/admin/gallery/[id]][DELETE]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to delete item',
    });
  }
}
