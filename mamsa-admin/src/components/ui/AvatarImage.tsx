'use client';

import { AppImage } from '@/components/ui/AppImage';
import { getAvatarColor, getInitials } from '@/lib/image-utils';

export interface AvatarImageProps {
  src: string | null | undefined;
  name: string | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeMap: Record<NonNullable<AvatarImageProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
  '2xl': 'h-32 w-32 text-3xl',
};

export function AvatarImage({ src, name, size = 'md', className }: AvatarImageProps) {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);
  const sizeClass = sizeMap[size];

  const fallback = (
    <div className={`flex items-center justify-center rounded-full text-white font-semibold ${sizeClass} ${bgColor}`}>
      {initials}
    </div>
  );

  return (
    <div className={`overflow-hidden rounded-full ${sizeClass} ${className ?? ''}`.trim()}>
      <AppImage src={src} alt={name ?? 'Avatar'} fallback={fallback} objectFit="cover" />
    </div>
  );
}
