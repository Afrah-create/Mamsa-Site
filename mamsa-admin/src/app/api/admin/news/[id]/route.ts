import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { isBase64Image } from '@/lib/cloudinary';
import { cloudinary } from '@/lib/cloudinary-server';

const allowedCategories = new Set(['general', 'events', 'announcements']);

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

const uploadValueToCloudinary = async (value?: string | null) => {
  if (!value || !isBase64Image(value)) {
    return value ?? null;
  }

  const result = await cloudinary.uploader.upload(value, {
    folder: 'mamsa/news',
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });

  return result.secure_url;
};

const uploadFileToCloudinary = async (file: File | null) => {
  if (!file || file.size === 0) {
    return null;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'mamsa/news',
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  });

  return result.secure_url;
};

const readNewsPayload = async (request: Request) => {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    return {
      title: String(formData.get('title') ?? '').trim(),
      content: String(formData.get('content') ?? '').trim(),
      category: String(formData.get('category') ?? '').trim(),
      date: String(formData.get('date') ?? '').trim() || null,
      author: String(formData.get('author') ?? '').trim(),
      status: String(formData.get('status') ?? 'published').trim(),
      featured_image: String(formData.get('featured_image') ?? '').trim() || null,
      featured_image_file: formData.get('featured_image_file') as File | null,
    };
  }

  const body = await request.json();
  return {
    title: String(body.title ?? '').trim(),
    content: String(body.content ?? '').trim(),
    category: String(body.category ?? '').trim(),
    date: body.date ?? null,
    author: String(body.author ?? '').trim(),
    status: String(body.status ?? 'published').trim(),
    featured_image: body.featured_image ?? null,
    featured_image_file: null,
  };
};

const getNewsById = async (id: number, hasFeaturedImage: boolean) => {
  if (hasFeaturedImage) {
    const rows = await sql`
      SELECT id, title, content, category, date, author, status, featured_image, created_at, updated_at
      FROM news
      WHERE id = ${id}
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  const rows = await sql`
    SELECT id, title, content, category, date, author, status, created_at, updated_at
    FROM news
    WHERE id = ${id}
    LIMIT 1
  `;

  return rows[0] ?? null;
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id: idValue } = await context.params;
    const id = Number(idValue);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid news id' }, { status: 400 });
    }

    const body = await readNewsPayload(request);

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!body.content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!body.category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    if (!allowedCategories.has(body.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const columns = await getNewsColumnInfo();
    const existing = await getNewsById(id, columns.hasFeaturedImage);

    if (!existing) {
      return NextResponse.json({ error: 'News article not found' }, { status: 404 });
    }

    const uploadedFileUrl = await uploadFileToCloudinary(body.featured_image_file);
    const uploadedImageUrl = uploadedFileUrl ?? (body.featured_image ? await uploadValueToCloudinary(body.featured_image) : null);
    const nextFeaturedImage = uploadedImageUrl ?? (columns.hasFeaturedImage ? existing.featured_image ?? null : null);

    if (columns.hasStatus && columns.hasFeaturedImage) {
      const rows = await sql`
        UPDATE news
        SET title = ${body.title},
            content = ${body.content},
            category = ${body.category},
            date = ${body.date ?? null},
            author = ${body.author ?? null},
            status = ${body.status || 'published'},
            featured_image = ${nextFeaturedImage},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, title, content, category, date, author, status, featured_image, created_at, updated_at
      `;

      return NextResponse.json({ data: rows[0] });
    }

    if (columns.hasStatus) {
      const rows = await sql`
        UPDATE news
        SET title = ${body.title},
            content = ${body.content},
            category = ${body.category},
            date = ${body.date ?? null},
            author = ${body.author ?? null},
            status = ${body.status || 'published'},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, title, content, category, date, author, status, created_at, updated_at
      `;

      return NextResponse.json({ data: rows[0] });
    }

    if (columns.hasFeaturedImage) {
      const rows = await sql`
        UPDATE news
        SET title = ${body.title},
            content = ${body.content},
            category = ${body.category},
            date = ${body.date ?? null},
            author = ${body.author ?? null},
            featured_image = ${nextFeaturedImage},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, title, content, category, date, author, featured_image, created_at, updated_at
      `;

      return NextResponse.json({ data: rows[0] });
    }

    const rows = await sql`
      UPDATE news
      SET title = ${body.title},
          content = ${body.content},
          category = ${body.category},
          date = ${body.date ?? null},
          author = ${body.author ?? null},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, title, content, category, date, author, created_at, updated_at
    `;

    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error('[api/admin/news/[id]][PATCH] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  try {
    const { id: idValue } = await context.params;
    const id = Number(idValue);

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid news id' }, { status: 400 });
    }

    const rows = await sql`
      DELETE FROM news
      WHERE id = ${id}
      RETURNING id
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: 'News article not found' }, { status: 404 });
    }

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error('[api/admin/news/[id]][DELETE] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
