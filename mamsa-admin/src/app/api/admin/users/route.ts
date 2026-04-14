import { requireAdmin } from '@/lib/auth';
import sql, { insertAndGetId } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { isBase64Image } from '@/lib/upload';
import { saveImage } from '@/lib/upload-server';
import { apiEnvelope } from '@/lib/api-envelope';

export type AdminUserPublic = {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  avatar_url: string | null;
  phone: string;
  bio: string;
  created_at: string;
  updated_at: string | null;
};

export async function GET() {
  await requireAdmin();

  try {
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
      ORDER BY id DESC
    `;

    return apiEnvelope(true, { data: { items: rows }, message: 'Users loaded' });
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
    const body = await request.json();
    const fullName = String(body.full_name ?? body.name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const role = String(body.role ?? 'admin').trim() || 'admin';
    const status = body.status != null ? String(body.status) : 'active';

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

    let avatarUrl: string | null = body.avatar_url ?? body.avatar ?? null;
    const avatarVal = body.avatar ?? body.avatar_url;
    if (isBase64Image(avatarVal)) {
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
    const phone = body.phone != null ? String(body.phone) : '';
    const bio = body.bio != null ? String(body.bio) : '';

    const insertId = await insertAndGetId`
      INSERT INTO admin_users (email, full_name, role, status, password_hash, avatar_url, phone, bio)
      VALUES (${email}, ${fullName}, ${role}, ${status}, ${passwordHash}, ${avatarUrl}, ${phone}, ${bio})
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
      WHERE id = ${insertId}
      LIMIT 1
    `;

    return apiEnvelope(true, { status: 201, data: rows[0], message: 'User created' });
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
