'use client';

import { ImageOff } from 'lucide-react';
import { AppImage } from '@/components/ui/AppImage';

export interface CardImageProps {
  src: string | null | undefined;
  alt: string;
  aspect?: 'video' | 'square' | 'portrait' | 'wide' | 'tall';
  fit?: 'cover' | 'contain';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  placeholderIcon?: React.ReactNode;
  placeholderLabel?: string;
  className?: string; // outer container
  imageClassName?: string; // img element
  overlay?: boolean;
  priority?: boolean;
  rounded?: 'none' | 'top' | 'all';
}

const aspectMap: Record<NonNullable<CardImageProps['aspect']>, string> = {
  video: 'aspect-video',
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[2/1]',
  tall: 'aspect-[4/5]',
};

const roundedMap: Record<NonNullable<CardImageProps['rounded']>, string> = {
  none: '',
  top: 'rounded-t-xl',
  all: 'rounded-xl',
};

const positionMap: Record<NonNullable<CardImageProps['position']>, string> = {
  center: 'object-center',
  top: 'object-top',
  bottom: 'object-bottom',
  left: 'object-left',
  right: 'object-right',
};

export function CardImage({
  src,
  alt,
  aspect = 'video',
  fit = 'cover',
  position = 'center',
  placeholderIcon,
  placeholderLabel,
  className,
  imageClassName,
  overlay = false,
  priority: _priority,
  rounded = 'top',
}: CardImageProps) {
  const icon = placeholderIcon ?? <ImageOff className="h-8 w-8 text-gray-300" aria-hidden />;
  const fallback = (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-emerald-900/50 dark:to-emerald-950/80">
      {icon}
      {placeholderLabel ? <span className="mt-2 text-xs text-gray-400 dark:text-emerald-500/90">{placeholderLabel}</span> : null}
    </div>
  );

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 dark:bg-emerald-900/40 ${aspectMap[aspect]} ${roundedMap[rounded]} ${className ?? ''}`.trim()}
    >
      <div className="absolute inset-0">
        <AppImage
          src={src}
          alt={alt}
          objectFit={fit === 'contain' ? 'contain' : 'cover'}
          className={`absolute inset-0 h-full w-full ${positionMap[position]} ${imageClassName ?? ''}`.trim()}
          fallback={fallback}
        />
      </div>
      {overlay ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      ) : null}
    </div>
  );
}
