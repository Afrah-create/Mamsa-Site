import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { signJWT, type SessionPayload } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';

type AdminUserRow = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  status: string;
  password_hash: string | null;
  avatar_url: string | null;
};

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const rows = await sql<AdminUserRow[]>`
      SELECT id, email, full_name as name, role, status, password_hash, avatar_url
      FROM admin_users
      WHERE LOWER(email) = LOWER(${email.trim()})
        AND status = 'active'
      LIMIT 1
    `;

    const admin = rows[0];

    if (!admin || !admin.password_hash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, admin.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const payload: SessionPayload = {
      id: admin.id,
      email: admin.email,
      name: admin.name ?? admin.email,
      role: admin.role,
      avatar_url: admin.avatar_url ?? '',
    };

    const token = await signJWT(payload);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: payload.id,
          email: payload.email,
          name: payload.name,
          role: payload.role,
          avatar_url: payload.avatar_url,
        },
      },
      { status: 200 }
    );

    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[api/auth/login][POST] Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
