import sql from '../src/lib/db';
import { hashPassword } from '../src/lib/password';

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@mamsa.org').trim().toLowerCase();
  const name = (process.env.SEED_ADMIN_NAME ?? 'MAMSA Admin').trim();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    throw new Error('Missing SEED_ADMIN_PASSWORD. Set it before running this script.');
  }

  const passwordHash = await hashPassword(password);

  const rows = await sql<
    Array<{
      id: number;
      email: string;
      name: string | null;
      role: string;
      status: string;
    }>
  >`
    INSERT INTO admin_users (email, full_name, role, status, password_hash)
    VALUES (${email}, ${name}, 'super_admin', 'active', ${passwordHash})
    ON CONFLICT (email)
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = 'super_admin',
      status = 'active',
      password_hash = EXCLUDED.password_hash
    RETURNING id, email, full_name AS name, role, status
  `;

  console.log('Admin account seeded successfully:', rows[0]);
}

void seedAdmin()
  .catch((error) => {
    console.error('Failed to seed admin account:', error);
    process.exit(1);
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
