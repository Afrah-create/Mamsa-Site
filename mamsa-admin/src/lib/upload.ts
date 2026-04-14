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

/** Data URL prefix check for admin image payloads. */
export function isBase64Image(value?: string | null): boolean {
  debugLog('H4', 'src/lib/upload.ts:isBase64Image', 'isBase64Image called', {
    hasValue: Boolean(value),
    startsWithDataImage: Boolean(value && /^data:image\//i.test(value)),
  });
  return Boolean(value && /^data:image\//i.test(value));
}

/** Stored path is a file we manage under `public/uploads/`. */
export function isLocalUploadPath(value?: string | null): boolean {
  if (!value || typeof value !== 'string') return false;
  const t = value.trim();
  debugLog('H4', 'src/lib/upload.ts:isLocalUploadPath', 'isLocalUploadPath called', {
    startsWithUploads: t.startsWith('/uploads/'),
  });
  return t.startsWith('/uploads/');
}

/**
 * Normalize DB-stored paths for `<Image src>` / `<img src>`: absolute URL unchanged,
 * leading `/` kept, otherwise single leading slash added.
 */
export function publicAssetUrl(value?: string | null): string {
  if (value == null || value === '') return '';
  const t = String(value).trim();
  debugLog('H1', 'src/lib/upload.ts:publicAssetUrl', 'publicAssetUrl called', {
    hasProtocol: t.startsWith('http://') || t.startsWith('https://'),
    startsWithSlash: t.startsWith('/'),
    runtime: typeof window === 'undefined' ? 'server' : 'browser',
  });
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  if (t.startsWith('/')) return t;
  return `/${t.replace(/^\/+/, '')}`;
}
