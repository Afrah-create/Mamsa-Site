import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import sql from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

type AdminUserRow = {
  id: number;
  email: string;
  name: string | null;
  role: 'super_admin' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  clerk_user_id: string | null;
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
      SELECT id, email, name, role, status, clerk_user_id
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
    const client = await clerkClient();

    const clerkUser = await client.users.createUser({
      emailAddress: [normalizedEmail],
      password: finalPassword,
      firstName: displayName,
      privateMetadata: {
        role: user.role,
        createdBy: createdBy ?? null,
      },
    });

    const rows = await sql<AdminUserRow[]>`
      INSERT INTO admin_users (email, name, role, status, clerk_user_id)
      VALUES (${normalizedEmail}, ${displayName}, ${user.role}, ${user.status ?? 'active'}, ${clerkUser.id})
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        clerk_user_id = EXCLUDED.clerk_user_id
      RETURNING id, email, name, role, status, clerk_user_id
    `;

    const adminUser = rows[0];

    return NextResponse.json({ 
      data: adminUser,
      message: 'User created successfully in Clerk and synced to admin_users.'
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

    const rows = await sql<AdminUserRow[]>`
      UPDATE admin_users
      SET name = ${user.name ?? user.full_name ?? null},
          email = ${user.email ?? ''},
          role = ${user.role ?? 'admin'},
          status = ${user.status ?? 'active'}
      WHERE id = ${id}
      RETURNING id, email, name, role, status, clerk_user_id
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
    const { clerkUserId } = await request.json();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'clerkUserId is required.' }, { status: 400 });
    }

    const client = await clerkClient();
    await client.users.deleteUser(clerkUserId);

    const rows = await sql<AdminUserRow[]>`
      UPDATE admin_users
      SET status = 'inactive'
      WHERE clerk_user_id = ${clerkUserId}
      RETURNING id, email, name, role, status, clerk_user_id
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

