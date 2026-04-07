import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getPublicUrl } from '@/lib/cloudinary';
import { isBase64Image, isCloudinaryPublicId } from '@/lib/cloudinary';
import { cloudinary } from '@/lib/cloudinary-server';

type ProfileRow = {
  id: number;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string;
  bio: string;
  role: string;
  created_at: string;
  updated_at?: string;
};

const mapProfileForClient = (row: ProfileRow | null) => {
  if (!row) return null;
  return {
    ...row,
    avatar_url: row.avatar_url && !row.avatar_url.startsWith('http') ? (getPublicUrl(row.avatar_url) || row.avatar_url) : row.avatar_url,
  };
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

    return NextResponse.json({ data: mapProfileForClient(rows[0] ?? null) });
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
      UPDATE admin_users
      SET email = ${body.email ?? user.email},
          full_name = ${body.full_name ?? user.name ?? ''},
          avatar_url = ${avatarUrl},
          phone = ${body.phone ?? ''},
          bio = ${body.bio ?? ''},
          updated_at = ${new Date().toISOString()}
      WHERE id = ${user.id}
         OR LOWER(email) = LOWER(${user.email})
      RETURNING id, user_id, email, full_name, avatar_url, phone, bio, role, created_at, updated_at
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ data: mapProfileForClient(rows[0] ?? null) });
  } catch (error) {
    console.error('[api/admin/profile][PATCH] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
