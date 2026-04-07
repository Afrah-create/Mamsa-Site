import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import sql from '@/lib/db';

type ProfileRow = {
  id: number;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  phone: string;
  bio: string;
  role: string;
  created_at: string;
  updated_at?: string;
};

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const rows = await sql<ProfileRow[]>`
      SELECT id, user_id, email, full_name, avatar_url, phone, bio, role, created_at, updated_at
      FROM admin_users
      WHERE clerk_user_id = ${user.id}
         OR LOWER(email) = LOWER(${user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? ''})
      LIMIT 1
    `;

    return NextResponse.json({ data: rows[0] ?? null });
  } catch (error) {
    console.error('[api/admin/profile][GET] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await request.json();

    const rows = await sql<ProfileRow[]>`
      INSERT INTO admin_users (clerk_user_id, user_id, email, full_name, avatar_url, phone, bio, role, updated_at)
      VALUES (
        ${user.id},
        ${user.id},
        ${body.email ?? ''},
        ${body.full_name ?? ''},
        ${body.avatar_url ?? ''},
        ${body.phone ?? ''},
        ${body.bio ?? ''},
        'admin',
        ${new Date().toISOString()}
      )
      ON CONFLICT (clerk_user_id)
      DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        phone = EXCLUDED.phone,
        bio = EXCLUDED.bio,
        updated_at = EXCLUDED.updated_at
      RETURNING id, user_id, email, full_name, avatar_url, phone, bio, role, created_at, updated_at
    `;

    return NextResponse.json({ data: rows[0] ?? null });
  } catch (error) {
    console.error('[api/admin/profile][PATCH] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
