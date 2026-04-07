import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { isBase64Image, isCloudinaryPublicId } from '@/lib/cloudinary';
import { cloudinary } from '@/lib/cloudinary-server';

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
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const rows = await sql<ProfileRow[]>`
      SELECT id, user_id, email, full_name, avatar_url, phone, bio, role, created_at, updated_at
      FROM admin_users
      WHERE id = ${user.id}
         OR LOWER(email) = LOWER(${user.email})
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
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await request.json();

    const existing = await sql<{ avatar_url: string | null }[]>`
      SELECT avatar_url
      FROM admin_users
      WHERE id = ${user.id}
         OR LOWER(email) = LOWER(${user.email})
      LIMIT 1
    `;

    const imageValue = body.image ?? body.avatar_url ?? null;
    let avatarUrl = imageValue ?? existing[0]?.avatar_url ?? '';
    if (isBase64Image(imageValue)) {
      if (isCloudinaryPublicId(existing[0]?.avatar_url)) {
        await cloudinary.uploader.destroy(existing[0].avatar_url as string);
      }

      const uploaded = await cloudinary.uploader.upload(imageValue, {
        folder: 'mamsa/admin_users',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });
      avatarUrl = uploaded.public_id;
    }

    const rows = await sql<ProfileRow[]>`
      INSERT INTO admin_users (id, user_id, email, full_name, avatar_url, phone, bio, role, updated_at)
      VALUES (
        ${user.id},
        ${String(user.id)},
        ${body.email ?? user.email},
        ${body.full_name ?? user.name ?? ''},
        ${avatarUrl},
        ${body.phone ?? ''},
        ${body.bio ?? ''},
        ${user.role ?? 'admin'},
        ${new Date().toISOString()}
      )
      ON CONFLICT (id)
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
