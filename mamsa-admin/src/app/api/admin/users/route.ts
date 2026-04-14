import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { isBase64Image } from '@/lib/upload';
import { saveImage } from '@/lib/upload-server';
import { apiEnvelope } from '@/lib/api-envelope';
import { rowToAdminUser, type AdminUser, type AdminUserRow } from '@/types/admin-user';

const ROLE_SET = new Set<string>(['super_admin', 'admin', 'moderator']);
const STATUS_SET = new Set<string>(['active', 'inactive', 'suspended']);

export async function GET() {
  await requireAdmin();

  try {
    const rows = await sql<AdminUserRow[]>`
      SELECT
        id,
        full_name,
        email,
        role,
        status,
        phone,
        bio,
        avatar_url,
        created_at,
        last_login
      FROM admin_users
      ORDER BY id DESC
    `;

    const items: AdminUser[] = rows.map((r) => rowToAdminUser(r));
    return apiEnvelope(true, { data: { items }, message: 'Users loaded' });
  } catch (error) {
    console.error('[api/admin/users][GET]', error);
    return apiEnvelope(false, {
      status: 500,
      error: error instanceof Error ? error.message : 'Database error',
      message: 'Failed to load users',
    });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fullName = String(body.full_name ?? body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const roleRaw = String(body.role ?? 'admin').trim();
    const statusRaw = body.status != null ? String(body.status).trim() : 'active';

    if (!fullName || !email) {
      return apiEnvelope(false, {
        status: 400,
        error: 'full_name and email are required',
        message: 'Validation failed',
      });
    }

    if (password.length < 8) {
      return apiEnvelope(false, {
        status: 400,
        error: 'Password must be at least 8 characters',
        message: 'Validation failed',
      });
    }

    const role = ROLE_SET.has(roleRaw) ? roleRaw : 'admin';
    const status = STATUS_SET.has(statusRaw) ? statusRaw : 'active';

    let avatarUrl: string | null = null;
    const avatarVal = body.avatar ?? body.avatar_url;
    if (isBase64Image(avatarVal as string)) {
      try {
        avatarUrl = await saveImage(avatarVal as string, 'avatars');
      } catch (e) {
        return apiEnvelope(false, {
          status: 500,
          error: e instanceof Error ? e.message : 'Avatar upload failed',
          message: 'Image upload error',
        });
      }
    }

    const passwordHash = await hashPassword(password);
    const phone = body.phone != null ? String(body.phone).trim() : '';
    const bio = body.bio != null ? String(body.bio).trim() : '';

    const insertId = await insertAndGetId`
      INSERT INTO admin_users (email, full_name, role, status, password_hash, avatar_url, phone, bio)
      VALUES (${email}, ${fullName}, ${role}, ${status}, ${passwordHash}, ${avatarUrl}, ${phone}, ${bio})
    `;

    const rows = await sql<AdminUserRow[]>`
      SELECT
        id,
        full_name,
        email,
        role,
        status,
        phone,
        bio,
        avatar_url,
        created_at,
        last_login
      FROM admin_users
      WHERE id = ${insertId}
      LIMIT 1
    `;

    if (!rows[0]) {
      return apiEnvelope(false, { status: 500, error: 'Insert failed', message: 'User not found after create' });
    }

    const created = rowToAdminUser(rows[0]);
    return apiEnvelope(true, { status: 201, data: created, message: 'User created' });
  } catch (error) {
    console.error('[api/admin/users][POST]', error);
    const msg = error instanceof Error ? error.message : 'Database error';
    if (msg.includes('Duplicate') || msg.includes('duplicate')) {
      return apiEnvelope(false, { status: 409, error: 'Email already exists', message: 'Conflict' });
    }
    return apiEnvelope(false, {
      status: 500,
      error: msg,
      message: 'Failed to create user',
    });
  }
}
