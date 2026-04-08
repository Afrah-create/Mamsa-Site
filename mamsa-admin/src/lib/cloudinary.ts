const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_HOST = 'res.cloudinary.com';

export const isHttpUrl = (value?: string | null) => Boolean(value && /^https?:\/\//i.test(value));

export const isBase64Image = (value?: string | null) => Boolean(value && /^data:image\//i.test(value));

export const isCloudinaryPublicId = (value?: string | null) => {
  if (!value) return false;
  if (isHttpUrl(value)) return false;
  if (isBase64Image(value)) return false;
  return true;
};

export const isCloudinaryDeliveryUrl = (url: string) =>
  url.includes(CLOUDINARY_HOST) && url.includes('/image/upload/');

/**
 * Inserts Cloudinary fetch/f_auto delivery parameters so the CDN serves
 * modern formats and caps dimensions (smaller files, faster LCP).
 * No-op for non-Cloudinary URLs or URLs that already include transformations.
 */
export function applyCloudinaryTransforms(url: string | null | undefined, maxWidth: number): string | null {
  if (!url || !maxWidth) {
    return url ?? null;
  }

  const trimmed = url.trim();
  if (!isCloudinaryDeliveryUrl(trimmed)) {
    return trimmed;
  }

  const marker = '/image/upload/';
  const idx = trimmed.indexOf(marker);
  if (idx === -1) {
    return trimmed;
  }

  const prefix = trimmed.slice(0, idx + marker.length);
  const rest = trimmed.slice(idx + marker.length);

  const firstSegment = rest.split('/')[0] ?? '';
  if (firstSegment.includes(',')) {
    return trimmed;
  }

  const w = Math.min(Math.max(32, Math.round(maxWidth)), 4000);
  const transforms = `f_auto,q_auto,w_${w},c_limit`;
  return `${prefix}${transforms}/${rest}`;
}

export const getPublicUrl = (publicId?: string | null) => {
  if (!publicId) return null;
  if (isHttpUrl(publicId)) return publicId;

  if (!cloudName) {
    return publicId;
  }

  const normalized = publicId.replace(/^\/+/, '');
  return `https://res.cloudinary.com/${cloudName}/image/upload/${normalized}`;
};

