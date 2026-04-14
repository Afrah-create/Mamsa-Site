/** Data URL prefix check for admin image payloads. */
export function isBase64Image(value?: string | null): boolean {
  return Boolean(value && /^data:image\//i.test(value));
}

/** Stored path is a file we manage under `public/uploads/`. */
export function isLocalUploadPath(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  const t = value.trim();
  return t.startsWith('/uploads/');
}

/**
 * Normalize DB-stored paths for `<Image src>` / `<img src>`: absolute URL unchanged,
 * leading `/` kept, otherwise single leading slash added.
 */
export function publicAssetUrl(value?: string | null): string {
  if (value == null || value === '') return '';
  const t = String(value).trim();
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  if (t.startsWith('/')) return t;
  return `/${t.replace(/^\/+/, '')}`;
}
