/**
 * Resolves any stored image value to a renderable src string or null.
 * Handles:
 * - /uploads/... local paths (returned by saveImage)
 * - /images/... static public assets
 * - https://... external URLs (legacy or external)
 * - null / undefined / empty string -> returns null
 */
export function resolveImageSrc(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null;
  if (value.startsWith('/')) return value;
  if (value.startsWith('http')) return value;
  return `/uploads/${value}`;
}

/**
 * Returns initials from a full name string (max 2 chars).
 * Used as avatar fallback.
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Deterministic color from a string - returns a Tailwind bg class.
 * Used for initials avatar backgrounds.
 */
export function getAvatarColor(seed: string | null | undefined): string {
  const colors = [
    'bg-emerald-500', 'bg-blue-500', 'bg-purple-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
  ];
  if (!seed) return colors[0];
  const index = seed.charCodeAt(0) % colors.length;
  return colors[index];
}
