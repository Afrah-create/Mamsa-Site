export interface NewsArticle {
  id: number;
  title: string;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  alt_text: string | null;
  status: 'published' | 'draft' | 'archived';
  tags: string[] | null;
  author: string | null;
  is_featured: number;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface NewsListResponse {
  items: NewsArticle[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

type NewsRow = {
  id: number;
  title: string;
  excerpt: string | null;
  content: string | null;
  image: string | null;
  author: string | null;
  tags: unknown;
  date: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date | null;
};

function toIso(v: string | Date | null | undefined): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  const s = String(v);
  return s || null;
}

export function parseNewsTags(raw: unknown): string[] | null {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch {
      return trimmed.split(',').map((v) => v.trim()).filter(Boolean);
    }
    return [];
  }
  return [];
}

export function rowToNewsArticle(row: NewsRow): NewsArticle {
  return {
    id: row.id,
    title: row.title,
    slug: null,
    excerpt: row.excerpt,
    content: row.content,
    featured_image: row.image,
    alt_text: null,
    status: 'published',
    tags: parseNewsTags(row.tags),
    author: row.author,
    is_featured: 0,
    published_at: toIso(row.date),
    created_at: toIso(row.created_at) ?? new Date().toISOString(),
    updated_at: toIso(row.updated_at),
  };
}
