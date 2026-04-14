export type GalleryStatus = 'active' | 'inactive';

/** Row shape from MySQL `gallery` before normalization. */
export type GalleryRowRaw = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  tags: unknown;
  photographer: string | null;
  location: string | null;
  event_date: string | Date | null;
  file_size: number | null;
  dimensions: unknown;
  status: string;
  featured: number;
  alt_text: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string | Date;
  updated_at: string | Date | null;
};

export interface GalleryItem {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  alt_text: string | null;
  tags: string[] | null;
  photographer: string | null;
  location: string | null;
  event_date: string | null;
  file_size: number | null;
  dimensions: { width: number; height: number } | null;
  status: GalleryStatus;
  /** 0 or 1 — mirrors DB `featured` column */
  is_featured: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface GalleryListStats {
  active: number;
  featured: number;
  categoriesCount: number;
}

export interface GalleryListResponse {
  items: GalleryItem[];
  total: number;
  totalPages: number;
  categories: string[];
  page: number;
  limit: number;
  stats: GalleryListStats;
}

/** Normalize request body `dimensions` for JSON column storage. */
export function parseDimensionsInput(input: unknown): { width: number; height: number } | null {
  if (input === undefined || input === null || input === '') return null;
  if (typeof input === 'string') {
    try {
      return parseDimensionsInput(JSON.parse(input));
    } catch {
      return null;
    }
  }
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;
  const o = input as Record<string, unknown>;
  const w = Number(o.width);
  const h = Number(o.height);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
  return { width: w, height: h };
}

function toIso(v: string | Date | null | undefined): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  const s = String(v);
  return s || null;
}

function toDateOnly(v: string | Date | null | undefined): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s || null;
}

export function parseTagsFromDb(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const arr = raw.map((t) => String(t).trim()).filter(Boolean);
    return arr.length ? arr : [];
  }
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) {
        const arr = p.map((t) => String(t).trim()).filter(Boolean);
        return arr.length ? arr : [];
      }
    } catch {
      return [];
    }
    return [];
  }
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(raw)) {
    try {
      const p = JSON.parse(raw.toString('utf8')) as unknown;
      if (Array.isArray(p)) {
        const arr = p.map((t) => String(t).trim()).filter(Boolean);
        return arr.length ? arr : [];
      }
    } catch {
      return [];
    }
  }
  return [];
}

export function parseDimensionsFromDb(raw: unknown): { width: number; height: number } | null {
  if (raw == null) return null;
  let obj: unknown = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(raw)) {
    try {
      obj = JSON.parse(raw.toString('utf8'));
    } catch {
      return null;
    }
  }
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return null;
  const w = Number((obj as { width?: unknown }).width);
  const h = Number((obj as { height?: unknown }).height);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
  return { width: w, height: h };
}

export function parseGalleryStatus(s: string): GalleryStatus {
  return s === 'inactive' ? 'inactive' : 'active';
}

export function rowToGalleryItem(row: GalleryRowRaw): GalleryItem {
  const tags = parseTagsFromDb(row.tags);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    image_url: row.image_url,
    alt_text: row.alt_text,
    tags,
    photographer: row.photographer,
    location: row.location,
    event_date: toDateOnly(row.event_date),
    file_size: row.file_size != null ? Number(row.file_size) : null,
    dimensions: parseDimensionsFromDb(row.dimensions),
    status: parseGalleryStatus(String(row.status ?? 'active')),
    is_featured: Number(row.featured) === 1 ? 1 : 0,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: toIso(row.created_at) ?? new Date().toISOString(),
    updated_at: toIso(row.updated_at ?? null),
  };
}
