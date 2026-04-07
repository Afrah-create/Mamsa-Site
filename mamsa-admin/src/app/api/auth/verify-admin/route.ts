import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import sql from '@/lib/db';

type AdminRow = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  status: string;
  clerk_user_id: string | null;
};

export async function POST() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ isAdmin: false, user: null, error: 'Unauthenticated' }, { status: 401 });
    }

    const primaryEmail =
      user.primaryEmailAddress?.emailAddress?.toLowerCase() ?? user.emailAddresses[0]?.emailAddress?.toLowerCase();

    const rows = await sql<AdminRow[]>`
      SELECT id, email, name, role, status, clerk_user_id
      FROM admin_users
      WHERE (
        clerk_user_id = ${user.id}
        OR (${primaryEmail ?? null} IS NOT NULL AND LOWER(email) = LOWER(${primaryEmail ?? null}))
      )
      LIMIT 1
    `;

    const adminData = rows[0];

    const validRoles = ['super_admin', 'admin', 'moderator'];
    const isAdmin = Boolean(adminData && validRoles.includes(adminData.role) && adminData.status === 'active');

    return NextResponse.json({
      isAdmin,
      user: adminData
        ? {
            id: adminData.id,
            email: adminData.email,
            name: adminData.name,
            role: adminData.role,
            status: adminData.status,
            clerk_user_id: adminData.clerk_user_id,
          }
        : null,
    }, { status: 200 });
  } catch (error) {
    console.error('[verify-admin] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}

