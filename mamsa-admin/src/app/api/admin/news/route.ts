import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { isBase64Image, isCloudinaryPublicId } from '@/lib/cloudinary';
import { cloudinary } from '@/lib/cloudinary-server';

let newsColumnsCache: { hasStatus: boolean; hasFeaturedImage: boolean } | null = null;

const getNewsColumnInfo = async () => {
  if (newsColumnsCache) return newsColumnsCache;

  const rows = await sql<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'news'
      AND column_name IN ('status', 'featured_image')
  `;

  const set = new Set(rows.map((row) => row.column_name));
  newsColumnsCache = {
    hasStatus: set.has('status'),
    hasFeaturedImage: set.has('featured_image'),
  };

  return newsColumnsCache;
};

const uploadNewsImageIfNeeded = async (value?: string | null) => {
  if (!isBase64Image(value)) {
    return value ?? null;
  }

  const result = await cloudinary.uploader.upload(value as string, {
    folder: 'mamsa/news',
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });

  return result.public_id;
};

export async function GET() {
  await requireAdmin();

  try {
    const columns = await getNewsColumnInfo();

    const rows = columns.hasStatus
      ? await sql`
          SELECT id, title, content, category, date, author, status,
            ${columns.hasFeaturedImage ? sql`featured_image` : sql`NULL::text AS featured_image`},
            created_at, updated_at
          FROM news
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT id, title, content, category, date, author,
            ${columns.hasFeaturedImage ? sql`featured_image` : sql`NULL::text AS featured_image`},
            created_at, updated_at
          FROM news
          ORDER BY created_at DESC
        `;

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('[api/admin/news][GET] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const body = await request.json();
    const columns = await getNewsColumnInfo();

    const featuredImage = columns.hasFeaturedImage
      ? await uploadNewsImageIfNeeded(body.featured_image ?? null)
      : null;

    let rows;
    if (columns.hasStatus && columns.hasFeaturedImage) {
      rows = await sql`
        INSERT INTO news (title, content, category, date, author, status, featured_image)
        VALUES (${body.title}, ${body.content ?? null}, ${body.category ?? null}, ${body.date ?? null}, ${body.author ?? null}, ${body.status ?? 'published'}, ${featuredImage})
        RETURNING *
      `;
    } else if (columns.hasStatus) {
      rows = await sql`
        INSERT INTO news (title, content, category, date, author, status)
        VALUES (${body.title}, ${body.content ?? null}, ${body.category ?? null}, ${body.date ?? null}, ${body.author ?? null}, ${body.status ?? 'published'})
        RETURNING *
      `;
    } else if (columns.hasFeaturedImage) {
      rows = await sql`
        INSERT INTO news (title, content, category, date, author, featured_image)
        VALUES (${body.title}, ${body.content ?? null}, ${body.category ?? null}, ${body.date ?? null}, ${body.author ?? null}, ${featuredImage})
        RETURNING *
      `;
    } else {
      rows = await sql`
        INSERT INTO news (title, content, category, date, author)
        VALUES (${body.title}, ${body.content ?? null}, ${body.category ?? null}, ${body.date ?? null}, ${body.author ?? null})
        RETURNING *
      `;
    }

    if (!columns.hasFeaturedImage && isCloudinaryPublicId(featuredImage)) {
      await cloudinary.uploader.destroy(featuredImage as string);
    }

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/news][POST] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
