import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { hashPassword } from '@/lib/password';

type AdminUserRow = {
  id: number;
  email: string;
  name: string | null;
  role: 'super_admin' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  user_id: string;
};

type Permissions = {
  news: boolean;
  events: boolean;
  leadership: boolean;
  gallery: boolean;
  users: boolean;
  reports: boolean;
};

type IncomingUser = {
  full_name?: string;
  name?: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions?: Permissions;
  status: 'active' | 'inactive' | 'suspended';
};

export async function GET() {
  await requireAdmin();

  try {
    const users = await sql<AdminUserRow[]>`
      SELECT id, email, full_name AS name, role, status, CAST(id AS CHAR) AS user_id
      FROM admin_users
      ORDER BY id DESC
    `;

    return NextResponse.json({ data: users }, { status: 200 });
  } catch (error) {
    console.error('[api/admin/users][GET] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const { user, password, createdBy }: { user: IncomingUser; password?: string; createdBy?: string | null } =
      await request.json();

    const displayName = user?.name?.trim() || user?.full_name?.trim();

    if (!user || !user.email || !displayName) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const finalPassword = password || (user.role === 'super_admin' ? 'adminmamsa' : null);

    if (!finalPassword) {
      return NextResponse.json({ error: 'Password is required for non-super-admin users.' }, { status: 400 });
    }

    if (finalPassword.length < 8) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters long.' 
      }, { status: 400 });
    }

    const normalizedEmail = user.email.trim().toLowerCase();
    const passwordHash = await hashPassword(finalPassword);

    await sql`
      INSERT INTO admin_users (email, full_name, role, status, password_hash)
      VALUES (${normalizedEmail}, ${displayName}, ${user.role}, ${user.status ?? 'active'}, ${passwordHash})
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name),
        role = VALUES(role),
        status = VALUES(status),
        password_hash = VALUES(password_hash)
    `;

    const rows = await sql<AdminUserRow[]>`
      SELECT id, email, full_name AS name, role, status, CAST(id AS CHAR) AS user_id
      FROM admin_users
      WHERE email = ${normalizedEmail}
      LIMIT 1
    `;

    const adminUser = rows[0];

    return NextResponse.json({ 
      data: adminUser,
      message: 'User created successfully.'
    }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/users] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  await requireAdmin();

  try {
    const { id, user }: { id: number; user: Partial<IncomingUser> & { full_name?: string; avatar_url?: string; phone?: string; bio?: string; department?: string; position?: string; permissions?: Permissions } } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required.' }, { status: 400 });
    }

    await sql`
      UPDATE admin_users
      SET full_name = ${user.name ?? user.full_name ?? null},
          email = ${user.email ?? ''},
          role = ${user.role ?? 'admin'},
          status = ${user.status ?? 'active'}
      WHERE id = ${id}
    `;

    const rows = await sql<AdminUserRow[]>`
      SELECT id, email, full_name AS name, role, status, CAST(id AS CHAR) AS user_id
      FROM admin_users
      WHERE id = ${id}
      LIMIT 1
    `;

    return NextResponse.json({ data: rows[0] ?? null }, { status: 200 });
  } catch (error) {
    console.error('[api/admin/users][PATCH] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  await requireAdmin();

  try {
    const { userId } = await request.json();
    const targetId = Number(userId);

    if (!userId || Number.isNaN(targetId)) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
    }

    await sql`
      UPDATE admin_users
      SET status = 'inactive'
      WHERE id = ${targetId}
    `;

    const rows = await sql<AdminUserRow[]>`
      SELECT id, email, full_name AS name, role, status, CAST(id AS CHAR) AS user_id
      FROM admin_users
      WHERE id = ${targetId}
      LIMIT 1
    `;

    return NextResponse.json({ data: rows[0] ?? null, message: 'User deactivated successfully.' }, { status: 200 });
  } catch (error) {
    console.error('[api/admin/users][DELETE] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}

