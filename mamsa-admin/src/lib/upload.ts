import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

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

/**
 * Save a base64 data URL to `public/uploads/{folder}/` and return `/uploads/{folder}/{uuid}.{ext}`.
 */
export async function saveImage(base64String: string, folder: string): Promise<string> {
  const trimmed = base64String.trim();
  const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(trimmed);
  if (!m) {
    throw new Error('Invalid base64 image data');
  }
  const mime = m[1].toLowerCase();
  const ext = MIME_TO_EXT[mime];
  if (!ext) {
    throw new Error(`Unsupported image type: ${mime}`);
  }

  const safeFolder = folder.replace(/[^a-z0-9-_]/gi, '');
  if (!safeFolder) {
    throw new Error('Invalid upload folder');
  }

  const buffer = Buffer.from(m[2], 'base64');
  const dir = path.join(process.cwd(), 'public', 'uploads', safeFolder);
  await fs.promises.mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const diskPath = path.join(dir, filename);
  await fs.promises.writeFile(diskPath, buffer);

  return `/uploads/${safeFolder}/${filename}`;
}

/**
 * Remove a file under `public/uploads/` if `storedPath` is a local upload URL.
 */
export async function deleteImage(storedPath: string | null | undefined): Promise<void> {
  if (!storedPath || !isLocalUploadPath(storedPath)) return;

  const relative = storedPath.replace(/^\/+/, '');
  const segments = relative.split('/').filter(Boolean);
  if (segments[0] !== 'uploads') return;

  const absFile = path.join(process.cwd(), 'public', ...segments);
  const publicRoot = path.resolve(path.join(process.cwd(), 'public'));
  const resolved = path.resolve(absFile);
  const uploadsRoot = path.join(publicRoot, 'uploads');
  if (!resolved.startsWith(uploadsRoot)) return;

  try {
    await fs.promises.unlink(resolved);
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw e;
  }
}
