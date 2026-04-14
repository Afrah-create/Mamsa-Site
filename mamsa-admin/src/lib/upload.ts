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

// Image URL resolution moved to `src/lib/image-utils.ts`.
