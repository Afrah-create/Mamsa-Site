import { clerkClient } from '@clerk/nextjs/server';
import sql from '../src/lib/db';

type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  role: string;
};

async function syncAdminUsers() {
  const client = await clerkClient();

  const admins = await sql<AdminUser[]>`
    SELECT id, email, name, role
    FROM admin_users
    WHERE status = 'active'
  `;

  for (const admin of admins) {
    const normalizedEmail = admin.email.trim().toLowerCase();

    const existingUsers = await client.users.getUserList({
      emailAddress: [normalizedEmail],
      limit: 1,
    });

    let clerkUserId: string;

    if (existingUsers.data.length > 0) {
      clerkUserId = existingUsers.data[0].id;
    } else {
      const createdUser = await client.users.createUser({
        emailAddress: [normalizedEmail],
        firstName: admin.name ?? undefined,
        privateMetadata: {
          role: admin.role,
          syncedFromAdminUsers: true,
        },
        skipPasswordRequirement: true,
      });

      clerkUserId = createdUser.id;
    }

    await sql`
      UPDATE admin_users
      SET clerk_user_id = ${clerkUserId}
      WHERE id = ${admin.id}
    `;

    console.log(`Synced admin ${admin.email} -> ${clerkUserId}`);
  }

  console.log(`Completed sync for ${admins.length} admin user(s).`);
}

syncAdminUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to sync admin users with Clerk:', error);
    process.exit(1);
  });