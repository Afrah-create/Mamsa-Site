import { randomUUID } from 'crypto';

import { isLocalUploadPath } from '@/lib/upload';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const DEBUG_ENDPOINT = 'http://127.0.0.1:7262/ingest/8887a3ef-1dfa-497f-b0b0-7e7ce64cd4bc';
const DEBUG_SESSION = 'c5130e';

function debugLog(hypothesisId: string, location: string, message: string, data: Record<string, unknown>) {
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': DEBUG_SESSION,
    },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION,
      runId: 'pre-fix',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
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
  const { default: fs } = await import('fs');
  const path = await import('path');
  const dir = path.join(process.cwd(), 'public', 'uploads', safeFolder);
  await fs.promises.mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const diskPath = path.join(dir, filename);
  await fs.promises.writeFile(diskPath, buffer);
  debugLog('H3', 'src/lib/upload-server.ts:saveImage', 'saveImage stored file', {
    folder: safeFolder,
    extension: ext,
    bytes: buffer.length,
  });

  return `/uploads/${safeFolder}/${filename}`;
}

/**
 * Remove a file under `public/uploads/` if `storedPath` is a local upload URL.
 */
export async function deleteImage(storedPath: string | null | undefined): Promise<void> {
  if (!storedPath || !isLocalUploadPath(storedPath)) return;

  const path = await import('path');
  const relative = storedPath.replace(/^\/+/, '');
  const segments = relative.split('/').filter(Boolean);
  if (segments[0] !== 'uploads') return;

  const absFile = path.join(process.cwd(), 'public', ...segments);
  const publicRoot = path.resolve(path.join(process.cwd(), 'public'));
  const resolved = path.resolve(absFile);
  const uploadsRoot = path.join(publicRoot, 'uploads');
  if (!resolved.startsWith(uploadsRoot)) return;

  const { default: fs } = await import('fs');
  try {
    await fs.promises.unlink(resolved);
    debugLog('H5', 'src/lib/upload-server.ts:deleteImage', 'deleteImage removed file', {
      storedPath,
      resolved,
    });
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw e;
  }
}
