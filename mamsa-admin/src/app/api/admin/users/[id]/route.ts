import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { deleteImage, isBase64Image, isLocalUploadPath, saveImage } from '@/lib/upload';
import { apiEnvelope } from '@/lib/api-envelope';
import type { AdminUserPublic } from '../route';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid id', message: 'Validation failed' });
    }

    const rows = await sql<AdminUserPublic[]>`
      SELECT
        id,
        email,
        full_name,
        role,
        status,
        avatar_url,
        phone,
        bio,
        created_at,
        updated_at
      FROM admin_users
      WHERE id = ${numericId}
      LIMIT 1
    `;

    if (!rows[0]) {
      return apiEnvelope(false, { status: 404, error: 'Not found', message: 'User not found' });
    }

    return apiEnvelope(true, { data: rows[0], message: 'User loaded' });
  } catch (error) {
    console.error('[api/admin/users/[id]][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load user',
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

    const existingRows = await sql<
      (AdminUserPublic & { password_hash: string | null })[]
    >`
      SELECT
        id,
        email,
        full_name,
        role,
        status,
        avatar_url,
        phone,
        bio,
        created_at,
        updated_at,
        password_hash
      FROM admin_users
      WHERE id = ${numericId}
      LIMIT 1
    `;
    const existing = existingRows[0];
    if (!existing) {
      return apiEnvelope(false, { status: 404, error: 'Not found', message: 'User not found' });
    }

    const body = await request.json();
    const fullName =
      body.full_name !== undefined || body.name !== undefined
        ? String(body.full_name ?? body.name).trim()
        : (existing.full_name ?? '');
    const email =
      body.email !== undefined ? String(body.email).trim().toLowerCase() : existing.email;
    const role = body.role !== undefined ? String(body.role).trim() : existing.role;
    const status = body.status !== undefined ? String(body.status) : existing.status;
    const phone = body.phone !== undefined ? String(body.phone) : existing.phone;
    const bio = body.bio !== undefined ? String(body.bio) : existing.bio;

    const imageVal = body.avatar ?? body.avatar_url;
    let avatarUrl: string | null = existing.avatar_url;
    if (isBase64Image(imageVal)) {
      try {
        if (isLocalUploadPath(existing.avatar_url)) {
          await deleteImage(existing.avatar_url);
        }
        avatarUrl = await saveImage(imageVal as string, 'avatars');
      } catch (e) {
        return apiEnvelope(false, {
          status: 500,
          error: e instanceof Error ? e.message : 'Avatar upload failed',
          message: 'Image upload error',
        });
      }
    } else if (imageVal !== undefined && imageVal !== null && !isBase64Image(imageVal)) {
      avatarUrl = String(imageVal);
    }

    let passwordHash = existing.password_hash;
    const newPassword = body.password != null ? String(body.password) : '';
    if (newPassword.length > 0) {
      if (newPassword.length < 8) {
        return apiEnvelope(false, {
          status: 400,
          error: 'Password must be at least 8 characters',
          message: 'Validation failed',
        });
      }
      passwordHash = await hashPassword(newPassword);
    }

    await sql`
      UPDATE admin_users
      SET
        email = ${email},
        full_name = ${fullName},
        role = ${role},
        status = ${status},
        avatar_url = ${avatarUrl},
        phone = ${phone},
        bio = ${bio},
        password_hash = ${passwordHash},
        updated_at = ${new Date().toISOString()}
      WHERE id = ${numericId}
    `;

    const rows = await sql<AdminUserPublic[]>`
      SELECT
        id,
        email,
        full_name,
        role,
        status,
        avatar_url,
        phone,
        bio,
        created_at,
        updated_at
      FROM admin_users
      WHERE id = ${numericId}
      LIMIT 1
    `;

    return apiEnvelope(true, { data: rows[0], message: 'User updated' });
  } catch (error) {
    console.error('[api/admin/users/[id]][PUT]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to update user',
    });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();

  try {
    const { id } = await context.params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return apiEnvelope(false, { status: 400, error: 'Invalid id', message: 'Validation failed' });
    }

    if (numericId === session.id) {
      return apiEnvelope(false, {
        status: 400,
        error: 'You cannot delete your own account',
        message: 'Validation failed',
      });
    }

    const existing = await sql<{ avatar_url: string | null }[]>`
      SELECT avatar_url FROM admin_users WHERE id = ${numericId} LIMIT 1
    `;
    if (!existing[0]) {
      return apiEnvelope(false, { status: 404, error: 'Not found', message: 'User not found' });
    }

    try {
      await deleteImage(existing[0].avatar_url);
    } catch (e) {
      console.warn('[api/admin/users/[id]][DELETE] deleteImage', e);
    }

    await sql`DELETE FROM admin_users WHERE id = ${numericId}`;

    return apiEnvelope(true, { data: { id: numericId, deleted: true }, message: 'User deleted' });
  } catch (error) {
    console.error('[api/admin/users/[id]][DELETE]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to delete user',
    });
  }
}
