import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import sql from './db';

export async function isAdmin(): Promise<boolean> {
  const user = await currentUser();

  if (!user) {
    return false;
  }

  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;

  const rows = await sql<[{ id: number }][]>`
    SELECT id
    FROM admin_users
    WHERE status = 'active'
      AND (
        clerk_user_id = ${user.id}
        OR (${email} IS NOT NULL AND LOWER(email) = LOWER(${email}))
      )
    LIMIT 1
  `;

  return rows.length > 0;
}

export async function requireAdmin(): Promise<void> {
  const allowed = await isAdmin();

  if (!allowed) {
    redirect('/login');
  }
}