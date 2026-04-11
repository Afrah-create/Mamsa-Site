import path from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const [{ default: sql }, { hashPassword }] = await Promise.all([
    import('../src/lib/db'),
    import('../src/lib/password'),
  ]);

  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@mamsa.org').trim().toLowerCase();
  const name = (process.env.SEED_ADMIN_NAME ?? 'MAMSA Admin').trim();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      'Missing SEED_ADMIN_PASSWORD. Add it to .env.local or set it in the shell before running npm run seed:admin.',
    );
  }

  const passwordHash = await hashPassword(password);

  await sql`
    INSERT INTO admin_users (email, full_name, role, status, password_hash)
    VALUES (${email}, ${name}, 'super_admin', 'active', ${passwordHash})
    ON DUPLICATE KEY UPDATE
      full_name = VALUES(full_name),
      role = 'super_admin',
      status = 'active',
      password_hash = VALUES(password_hash)
  `;

  const rows = await sql<
    Array<{
      id: number;
      email: string;
      name: string | null;
      role: string;
      status: string;
    }>
  >`
    SELECT id, email, full_name AS name, role, status
    FROM admin_users
    WHERE email = ${email}
    LIMIT 1
  `;

  console.log('Admin account seeded successfully:', rows[0]);
  await sql.end();
}

void main().catch((error) => {
  console.error('Failed to seed admin account:', error);
  process.exit(1);
});
