import sql from '@/lib/db';
import { requireAdmin, signJWT, type SessionPayload } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';
import { isBase64Image, isLocalUploadPath } from '@/lib/upload';
import { deleteImage, saveImage } from '@/lib/upload-server';
import { apiEnvelope } from '@/lib/api-envelope';

const SESSION_COOKIE_NAME = 'admin_session';

type ProfileRow = {
  id: number;
  full_name: string | null;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: Date | string;
};

export type AdminProfilePublic = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
};

function rowToPublic(row: ProfileRow): AdminProfilePublic {
  return {
    id: row.id,
    full_name: (row.full_name ?? '').trim() || row.email,
    email: row.email,
    role: row.role,
    avatar_url: row.avatar_url,
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

export async function GET() {
  const session = await requireAdmin();

  try {
    const rows = await sql<ProfileRow[]>`
      SELECT id, full_name, email, role, avatar_url, created_at
      FROM admin_users
      WHERE id = ${session.id}
      LIMIT 1
    `;

    if (!rows[0]) {
      return apiEnvelope(false, { status: 404, error: 'Not found', message: 'Profile not found' });
    }

    return apiEnvelope(true, { data: rowToPublic(rows[0]), message: 'Profile loaded' });
  } catch (error) {
    console.error('[api/admin/profile][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load profile',
    });
  }
}

export async function PUT(request: Request) {
  const session = await requireAdmin();

  try {
    const body = (await request.json()) as {
      full_name?: string;
      email?: string;
      current_password?: string;
      new_password?: string;
      avatar?: string | null;
    };

    const fullName = String(body.full_name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();

    if (!fullName || !email) {
      return apiEnvelope(false, {
        status: 400,
        error: 'Full name and email are required',
        message: 'Validation failed',
      });
    }

    const existingRows = await sql<
      (ProfileRow & { password_hash: string | null })[]
    >`
      SELECT id, full_name, email, role, avatar_url, created_at, password_hash
      FROM admin_users
      WHERE id = ${session.id}
      LIMIT 1
    `;
    const existing = existingRows[0];
    if (!existing) {
      return apiEnvelope(false, { status: 404, error: 'Not found', message: 'Profile not found' });
    }

    const newPassword =
      body.new_password != null && String(body.new_password).length > 0
        ? String(body.new_password)
        : '';
    const currentPassword =
      body.current_password != null ? String(body.current_password) : '';

    if (newPassword.length > 0) {
      if (!currentPassword) {
        return apiEnvelope(false, {
          status: 400,
          error: 'Current password is required to set a new password',
          message: 'Validation failed',
        });
      }
      if (newPassword.length < 8) {
        return apiEnvelope(false, {
          status: 400,
          error: 'New password must be at least 8 characters',
          message: 'Validation failed',
        });
      }
      if (!existing.password_hash) {
        return apiEnvelope(false, {
          status: 400,
          error: 'Password change is not available for this account',
          message: 'Validation failed',
        });
      }
      const ok = await verifyPassword(currentPassword, existing.password_hash);
      if (!ok) {
        return apiEnvelope(false, {
          status: 400,
          error: 'Current password is incorrect',
          message: 'Validation failed',
        });
      }
    }

    const dup = await sql<{ id: number }[]>`
      SELECT id FROM admin_users
      WHERE LOWER(email) = ${email}
        AND id <> ${session.id}
      LIMIT 1
    `;
    if (dup[0]) {
      return apiEnvelope(false, {
        status: 400,
        error: 'Email is already in use',
        message: 'Validation failed',
      });
    }

    let avatarUrl: string | null = existing.avatar_url;
    const avatarVal = body.avatar;
    if (avatarVal != null && isBase64Image(avatarVal)) {
      try {
        if (isLocalUploadPath(existing.avatar_url)) {
          await deleteImage(existing.avatar_url);
        }
        avatarUrl = await saveImage(avatarVal, 'avatars');
      } catch (e) {
        return apiEnvelope(false, {
          status: 500,
          error: e instanceof Error ? e.message : 'Avatar upload failed',
          message: 'Image upload error',
        });
      }
    }

    let passwordHash = existing.password_hash;
    if (newPassword.length > 0) {
      passwordHash = await hashPassword(newPassword);
    }

    await sql`
      UPDATE admin_users
      SET
        full_name = ${fullName},
        email = ${email},
        avatar_url = ${avatarUrl},
        password_hash = ${passwordHash},
        updated_at = NOW()
      WHERE id = ${session.id}
    `;

    const rows = await sql<ProfileRow[]>`
      SELECT id, full_name, email, role, avatar_url, created_at
      FROM admin_users
      WHERE id = ${session.id}
      LIMIT 1
    `;

    const updated = rows[0];
    if (!updated) {
      return apiEnvelope(false, { status: 500, error: 'Update failed', message: 'Profile not found after update' });
    }

    const publicRow = rowToPublic(updated);

    const jwtPayload: SessionPayload = {
      id: publicRow.id,
      email: publicRow.email,
      name: publicRow.full_name,
      role: publicRow.role,
      avatar_url: publicRow.avatar_url ?? '',
    };

    const token = await signJWT(jwtPayload);
    const res = apiEnvelope(true, { data: publicRow, message: 'Profile updated' });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });
    return res;
  } catch (error) {
    console.error('[api/admin/profile][PUT]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to update profile',
    });
  }
}
