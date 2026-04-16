import Link from 'next/link';
import { UserRound } from 'lucide-react';
import type { NotableAlumnus } from '@/lib/public-content';
import { CardImage } from '@/components/ui/CardImage';

type Props = {
  alumnus: NotableAlumnus;
};

export default function NotableAlumniCard({ alumnus }: Props) {
  const profession =
    [alumnus.current_position, alumnus.organization].filter(Boolean).join(' • ') ||
    alumnus.specialty ||
    'Community leader';

  return (
    <article className="surface-interactive motion-reveal overflow-hidden rounded-xl">
      <CardImage
        src={alumnus.image_url}
        alt={alumnus.full_name || 'Alumni'}
        aspect="square"
        position="top"
        overlay={false}
        rounded="top"
        placeholderIcon={<UserRound className="h-8 w-8 text-gray-300 dark:text-emerald-700/80" />}
        placeholderLabel="No photo"
      />
      <div className="p-3.5">
        <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 dark:text-emerald-50">
          <Link href={`/community/alumni/${alumnus.id}`} className="hover:text-emerald-700 dark:hover:text-emerald-300">
            {alumnus.full_name}
          </Link>
        </h3>
        <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {alumnus.graduation_year != null ? `Class of ${alumnus.graduation_year}` : 'MAMSA Alumni'}
        </p>
        <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-emerald-300/70">{profession}</p>
      </div>
    </article>
  );
}
