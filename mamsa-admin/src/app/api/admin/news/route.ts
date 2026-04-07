import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { isBase64Image } from '@/lib/cloudinary';
import { cloudinary } from '@/lib/cloudinary-server';

const allowedCategories = new Set(['general', 'events', 'announcements']);

let newsColumnsCache: {
  hasStatus: boolean;
  hasImageUrl: boolean;
  hasFeaturedImage: boolean;
} | null = null;

const getNewsColumnInfo = async () => {
  if (newsColumnsCache) return newsColumnsCache;

  const rows = await sql<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'news'
      AND column_name IN ('status', 'image_url', 'featured_image')
  `;

  const set = new Set(rows.map((row) => row.column_name));
  newsColumnsCache = {
    hasStatus: set.has('status'),
    hasImageUrl: set.has('image_url'),
    hasFeaturedImage: set.has('featured_image'),
  };

  return newsColumnsCache;
};

const getNewsImageColumn = (columns: NonNullable<typeof newsColumnsCache>) => {
  if (columns.hasImageUrl) return 'image_url' as const;
  if (columns.hasFeaturedImage) return 'featured_image' as const;
  return null;
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
      image: String(formData.get('image') ?? '').trim() || String(formData.get('featured_image') ?? '').trim() || null,
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
    image: body.image ?? body.featured_image ?? null,
    featured_image: body.featured_image ?? null,
    featured_image_file: null,
  };
};

export async function GET() {
  await requireAdmin();

  try {
    const columns = await getNewsColumnInfo();
    const imageSelection = columns.hasImageUrl
      ? sql`image_url AS featured_image`
      : columns.hasFeaturedImage
        ? sql`featured_image AS featured_image`
        : sql`NULL::text AS featured_image`;

    const rows = columns.hasStatus
      ? await sql`
          SELECT id, title, content, category, date, author, status, ${imageSelection}, created_at, updated_at
          FROM news
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT id, title, content, category, date, author, ${imageSelection}, created_at, updated_at
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
    const body = await readNewsPayload(request);

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!body.content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const category = allowedCategories.has(body.category) ? body.category : 'general';
    if (!allowedCategories.has(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const date = body.date || new Date().toISOString().split('T')[0];
    const content = body.content || '';
    const author = body.author || 'Admin';
    const image = body.image || null;
    const status = body.status || 'published';
    const columns = await getNewsColumnInfo();
    const imageColumn = getNewsImageColumn(columns);

    const uploadedFromFile = await uploadFileToCloudinary(body.featured_image_file);
    const uploadedFromValue = uploadedFromFile ?? (image ? await uploadNewsImageIfNeeded(image) : null);
    const imageUrl = uploadedFromValue;

    if (columns.hasStatus && imageColumn === 'image_url') {
      const rows = await sql`
        INSERT INTO news (title, content, category, date, author, status, image_url)
        VALUES (${body.title}, ${content}, ${category}, ${date}, ${author}, ${status}, ${imageUrl})
        RETURNING *
      `;

      return NextResponse.json({ data: rows[0] }, { status: 201 });
    }

    if (columns.hasStatus && imageColumn === 'featured_image') {
      const rows = await sql`
        INSERT INTO news (title, content, category, date, author, status, featured_image)
        VALUES (${body.title}, ${content}, ${category}, ${date}, ${author}, ${status}, ${imageUrl})
        RETURNING *
      `;

      return NextResponse.json({ data: rows[0] }, { status: 201 });
    }

    if (imageColumn === 'image_url') {
      const rows = await sql`
        INSERT INTO news (title, content, category, date, author, image_url)
        VALUES (${body.title}, ${content}, ${category}, ${date}, ${author}, ${imageUrl})
        RETURNING *
      `;

      return NextResponse.json({ data: rows[0] }, { status: 201 });
    }

    if (imageColumn === 'featured_image') {
      const rows = await sql`
        INSERT INTO news (title, content, category, date, author, featured_image)
        VALUES (${body.title}, ${content}, ${category}, ${date}, ${author}, ${imageUrl})
        RETURNING *
      `;

      return NextResponse.json({ data: rows[0] }, { status: 201 });
    }

    const rows = await sql`
      INSERT INTO news (title, content, category, date, author)
      VALUES (${body.title}, ${content}, ${category}, ${date}, ${author})
      RETURNING *
    `;

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[api/admin/news][POST] Unexpected error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected error' }, { status: 500 });
  }
}
