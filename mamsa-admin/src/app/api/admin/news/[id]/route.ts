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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    const numericId = Number(id);
    const body = await request.json();
    const columns = await getNewsColumnInfo();
    const existing = columns.hasFeaturedImage
      ? await sql<{ featured_image: string | null }[]>`
          SELECT featured_image
          FROM news
          WHERE id = ${numericId}
          LIMIT 1
        `
      : [];

    let nextFeaturedImage = body.featured_image ?? null;
    if (columns.hasFeaturedImage && isBase64Image(body.featured_image ?? null)) {
      if (isCloudinaryPublicId(existing[0]?.featured_image)) {
        await cloudinary.uploader.destroy(existing[0].featured_image as string);
      }

      const uploaded = await cloudinary.uploader.upload(body.featured_image, {
        folder: 'mamsa/news',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });
      nextFeaturedImage = uploaded.public_id;
    }

    let rows;
    if (columns.hasStatus && columns.hasFeaturedImage) {
      rows = await sql`
        UPDATE news
        SET title = ${body.title},
            content = ${body.content ?? null},
            category = ${body.category ?? null},
            date = ${body.date ?? null},
            author = ${body.author ?? null},
            status = ${body.status ?? 'published'},
            featured_image = ${nextFeaturedImage},
            updated_at = ${new Date().toISOString()}
        WHERE id = ${numericId}
        RETURNING *
      `;
    } else if (columns.hasStatus) {
      rows = await sql`
        UPDATE news
        SET title = ${body.title},
            content = ${body.content ?? null},
            category = ${body.category ?? null},
            date = ${body.date ?? null},
            author = ${body.author ?? null},
            status = ${body.status ?? 'published'},
            updated_at = ${new Date().toISOString()}
        WHERE id = ${numericId}
        RETURNING *
      `;
    } else if (columns.hasFeaturedImage) {
      rows = await sql`
        UPDATE news
        SET title = ${body.title},
            content = ${body.content ?? null},
            category = ${body.category ?? null},
            date = ${body.date ?? null},
            author = ${body.author ?? null},
            featured_image = ${nextFeaturedImage},
            updated_at = ${new Date().toISOString()}
        WHERE id = ${numericId}
        RETURNING *
      `;
    } else {
      rows = await sql`
        UPDATE news
        SET title = ${body.title},
            content = ${body.content ?? null},
            category = ${body.category ?? null},
            date = ${body.date ?? null},
            author = ${body.author ?? null},
            updated_at = ${new Date().toISOString()}
        WHERE id = ${numericId}
        RETURNING *
      `;
    }

    return NextResponse.json({ data: rows[0] ?? null });
  } catch (error) {
    console.error('[api/admin/news][PATCH] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id } = await params;
    const numericId = Number(id);
    const columns = await getNewsColumnInfo();
    const existing = columns.hasFeaturedImage
      ? await sql<{ featured_image: string | null }[]>`
          SELECT featured_image
          FROM news
          WHERE id = ${numericId}
          LIMIT 1
        `
      : [];

    await sql`DELETE FROM news WHERE id = ${numericId}`;

    if (columns.hasFeaturedImage && isCloudinaryPublicId(existing[0]?.featured_image)) {
      await cloudinary.uploader.destroy(existing[0].featured_image as string);
    }

    return NextResponse.json({ data: true });
  } catch (error) {
    console.error('[api/admin/news][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
