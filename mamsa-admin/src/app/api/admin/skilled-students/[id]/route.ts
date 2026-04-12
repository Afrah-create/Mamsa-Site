import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { toMysqlJson } from '@/lib/mysql-json';
import { deleteImage, isBase64Image, isLocalUploadPath, saveImage } from '@/lib/upload';
import { apiEnvelope } from '@/lib/api-envelope';

type StudentRow = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  bio: string | null;
  category: 'skill' | 'business';
  title: string;
  description: string | null;
  location: string | null;
  website_url: string | null;
  social_links: unknown;
  is_active: number;
  is_featured: number;
};

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid id', message: 'Validation failed' });
    }

    const rows = await sql<StudentRow[]>`
      SELECT * FROM skilled_students WHERE id = ${numericId} LIMIT 1
    `;
    if (!rows[0]) {
      return apiEnvelope(false, { status: 404, error: 'Student not found', message: 'Not found' });
    }

    const payments = await sql<Record<string, unknown>[]>`
      SELECT * FROM student_payments
      WHERE student_id = ${numericId}
      ORDER BY payment_date DESC, id DESC
    `;

    return apiEnvelope(true, {
      data: { student: rows[0], payments },
      message: 'Skilled student loaded',
    });
  } catch (error) {
    console.error('[api/admin/skilled-students/[id]][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load student',
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

    const body = await request.json();
    const existingRows = await sql<StudentRow[]>`
      SELECT * FROM skilled_students WHERE id = ${numericId} LIMIT 1
    `;
    const existing = existingRows[0];
    if (!existing) {
      return apiEnvelope(false, { status: 404, error: 'Student not found', message: 'Not found' });
    }

    let profileImage: string | null = existing.profile_image;
    const imgVal = body.profile_image ?? body.profileImage;
    if (isBase64Image(imgVal)) {
      try {
        if (isLocalUploadPath(existing.profile_image)) {
          await deleteImage(existing.profile_image);
        }
        profileImage = await saveImage(imgVal as string, 'students');
      } catch (e) {
        console.error('[api/admin/skilled-students/[id]][PUT] Image upload failed', e);
        return apiEnvelope(false, {
          status: 500,
          error: e instanceof Error ? e.message : 'Image upload failed',
          message: 'Image upload error',
        });
      }
    } else if (imgVal !== undefined && imgVal !== null && !isBase64Image(imgVal)) {
      profileImage = String(imgVal);
    }

    const fullName = body.full_name !== undefined ? String(body.full_name).trim() : existing.full_name;
    const email = body.email !== undefined ? String(body.email).trim().toLowerCase() : existing.email;
    const categoryRaw = body.category !== undefined ? String(body.category).trim().toLowerCase() : existing.category;
    if (categoryRaw !== 'skill' && categoryRaw !== 'business') {
      return apiEnvelope(false, {
        status: 400,
        error: "category must be 'skill' or 'business'",
        message: 'Validation failed',
      });
    }
    const category = categoryRaw as 'skill' | 'business';

    const title = body.title !== undefined ? String(body.title).trim() : existing.title;
    const phone = body.phone !== undefined ? body.phone : existing.phone;
    const bio = body.bio !== undefined ? body.bio : existing.bio;
    const description = body.description !== undefined ? body.description : existing.description;
    const location = body.location !== undefined ? body.location : existing.location;
    const websiteUrl =
      body.website_url !== undefined || body.websiteUrl !== undefined
        ? (body.website_url ?? body.websiteUrl)
        : existing.website_url;
    const socialLinksJson = toMysqlJson(
      body.social_links !== undefined || body.socialLinks !== undefined
        ? (body.social_links ?? body.socialLinks)
        : existing.social_links,
    );
    const isActive =
      body.is_active !== undefined || body.isActive !== undefined
        ? Number(body.is_active ?? body.isActive)
        : existing.is_active;
    const isFeatured =
      body.is_featured !== undefined || body.isFeatured !== undefined
        ? Number(body.is_featured ?? body.isFeatured)
        : existing.is_featured;

    await sql`
      UPDATE skilled_students
      SET
        full_name = ${fullName},
        email = ${email},
        phone = ${phone},
        profile_image = ${profileImage},
        bio = ${bio},
        category = ${category},
        title = ${title},
        description = ${description},
        location = ${location},
        website_url = ${websiteUrl},
        social_links = ${socialLinksJson},
        is_active = ${isActive},
        is_featured = ${isFeatured},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${numericId}
    `;

    const rows = await sql<StudentRow[]>`
      SELECT * FROM skilled_students WHERE id = ${numericId} LIMIT 1
    `;

    return apiEnvelope(true, { data: rows[0], message: 'Skilled student updated' });
  } catch (error) {
    console.error('[api/admin/skilled-students/[id]][PUT]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to update student',
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

    const existing = await sql<{ profile_image: string | null }[]>`
      SELECT profile_image FROM skilled_students WHERE id = ${numericId} LIMIT 1
    `;
    if (!existing[0]) {
      return apiEnvelope(false, { status: 404, error: 'Student not found', message: 'Not found' });
    }

    try {
      await deleteImage(existing[0].profile_image);
    } catch (e) {
      console.warn('[api/admin/skilled-students/[id]][DELETE] Local file delete failed', e);
    }

    await sql`DELETE FROM skilled_students WHERE id = ${numericId}`;

    return apiEnvelope(true, { data: { id: numericId, deleted: true }, message: 'Student deleted' });
  } catch (error) {
    console.error('[api/admin/skilled-students/[id]][DELETE]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to delete student',
    });
  }
}
