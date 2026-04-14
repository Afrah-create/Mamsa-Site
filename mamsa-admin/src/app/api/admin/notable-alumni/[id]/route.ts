import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { toMysqlJson } from '@/lib/mysql-json';
import { isBase64Image, isLocalUploadPath } from '@/lib/upload';
import { deleteImage, saveImage } from '@/lib/upload-server';
import { apiEnvelope } from '@/lib/api-envelope';

type AlumniRow = {
  id: number;
  full_name: string;
  slug: string | null;
  graduation_year: number | null;
  biography: string | null;
  achievements: string | null;
  current_position: string | null;
  organization: string | null;
  specialty: string | null;
  image_url: string | null;
  profile_links: unknown;
  featured: number;
  status: string;
  order_position: number;
};

function toNullableString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const parsed = String(value).trim();
  return parsed.length > 0 ? parsed : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
      SELECT * FROM notable_alumni WHERE id = ${numericId} LIMIT 1
    `;
    if (!rows[0]) {
      return apiEnvelope(false, { status: 404, error: 'Not found', message: 'Alumni not found' });
    }

    return apiEnvelope(true, { data: rows[0], message: 'Alumni loaded' });
  } catch (error) {
    console.error('[api/admin/notable-alumni/[id]][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load alumni',
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

    const existingRows = await sql<AlumniRow[]>`
      SELECT * FROM notable_alumni WHERE id = ${numericId} LIMIT 1
    `;
    const existing = existingRows[0];
    if (!existing) {
      return apiEnvelope(false, { status: 404, error: 'Not found', message: 'Alumni not found' });
    }

    const body = await request.json();
    const imageVal = body.image ?? body.image_url;

    let imageUrl: string | null = existing.image_url;
    if (isBase64Image(imageVal)) {
      try {
        if (isLocalUploadPath(existing.image_url)) {
          await deleteImage(existing.image_url);
        }
        imageUrl = await saveImage(imageVal as string, 'alumni');
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

    const fullName = body.full_name !== undefined ? String(body.full_name).trim() : existing.full_name;
    if (!fullName) {
      return apiEnvelope(false, { status: 400, error: 'full_name is required', message: 'Validation failed' });
    }

    const slug = toNullableString(body.slug !== undefined ? body.slug : existing.slug);
    const graduationYear = toNullableNumber(
      body.graduation_year !== undefined ? body.graduation_year : existing.graduation_year,
    );
    const biography = toNullableString(
      body.biography !== undefined || body.bio !== undefined
        ? (body.biography ?? body.bio)
        : existing.biography,
    );
    const achievements = toNullableString(
      body.achievements !== undefined || body.achievement !== undefined
        ? (body.achievements ?? body.achievement)
        : existing.achievements,
    );
    const currentPosition = toNullableString(
      body.current_position !== undefined || body.profession !== undefined
        ? (body.current_position ?? body.profession)
        : existing.current_position,
    );
    const organization = toNullableString(
      body.organization !== undefined ? body.organization : existing.organization,
    );
    const specialty = toNullableString(body.specialty !== undefined ? body.specialty : existing.specialty);
    const profileLinksJson = toMysqlJson(
      body.profile_links !== undefined ? body.profile_links : existing.profile_links,
    );
    const featured =
      body.is_featured !== undefined || body.featured !== undefined
        ? Number(body.is_featured ?? body.featured) ? 1 : 0
        : existing.featured;
    const status = toNullableString(body.status !== undefined ? body.status : existing.status) ?? 'draft';
    const orderPosition =
      body.order_position !== undefined ? Number(body.order_position) || 0 : existing.order_position;

    await sql`
      UPDATE notable_alumni
      SET
        full_name = ${fullName},
        slug = ${slug},
        graduation_year = ${graduationYear},
        biography = ${biography},
        achievements = ${achievements},
        current_position = ${currentPosition},
        organization = ${organization},
        specialty = ${specialty},
        image_url = ${imageUrl},
        profile_links = ${profileLinksJson},
        featured = ${featured},
        status = ${status},
        order_position = ${orderPosition},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${numericId}
    `;

    const rows = await sql<Record<string, unknown>[]>`
      SELECT * FROM notable_alumni WHERE id = ${numericId} LIMIT 1
    `;

    return apiEnvelope(true, { data: rows[0], message: 'Alumni updated' });
  } catch (error) {
    console.error('[api/admin/notable-alumni/[id]][PUT]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to update alumni',
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
      SELECT image_url FROM notable_alumni WHERE id = ${numericId} LIMIT 1
    `;
    if (!existing[0]) {
      return apiEnvelope(false, { status: 404, error: 'Not found', message: 'Alumni not found' });
    }

    try {
      await deleteImage(existing[0].image_url);
    } catch (e) {
      console.warn('[api/admin/notable-alumni/[id]][DELETE] deleteImage', e);
    }

    await sql`DELETE FROM notable_alumni WHERE id = ${numericId}`;

    return apiEnvelope(true, { data: { id: numericId, deleted: true }, message: 'Alumni deleted' });
  } catch (error) {
    console.error('[api/admin/notable-alumni/[id]][DELETE]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to delete alumni',
    });
  }
}
