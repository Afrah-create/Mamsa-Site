import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';

type PasswordRow = {
  id: number;
  password_hash: string | null;
};

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new passwords are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
    }

    const rows = await sql<PasswordRow[]>`
      SELECT id, password_hash
      FROM admin_users
      WHERE id = ${session.id}
      LIMIT 1
    `;

    const user = rows[0];
    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isCurrentValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const newHash = await hashPassword(newPassword);

    await sql`
      UPDATE admin_users
      SET password_hash = ${newHash}, updated_at = ${new Date().toISOString()}
      WHERE id = ${session.id}
    `;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[api/admin/change-password][POST] Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
