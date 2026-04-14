'use client';

import { useMemo, useState } from 'react';
import { resolveImageSrc } from '@/lib/image-utils';

export interface AppImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  objectFit?: 'cover' | 'contain' | 'fill';
}

export function AppImage({
  src,
  alt,
  className,
  fallback = null,
  objectFit = 'cover',
}: AppImageProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = useMemo(() => resolveImageSrc(src), [src]);

  if (!resolvedSrc || failed) return <>{fallback}</>;

  const fitClass = objectFit === 'contain' ? 'object-contain' : objectFit === 'fill' ? 'object-fill' : 'object-cover';
  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`h-full w-full ${fitClass} ${className ?? ''}`.trim()}
    />
  );
}
