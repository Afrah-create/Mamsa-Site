import Link from 'next/link';
import { Briefcase, MapPin } from 'lucide-react';
import type { SkilledStudentPublic } from '@/lib/public-content';
import { CardImage } from '@/components/ui/CardImage';

function categoryLabel(category: SkilledStudentPublic['category']) {
  return category === 'business' ? 'Business' : 'Skill';
}

type Props = {
  student: SkilledStudentPublic;
};

export default function SkilledStudentCard({ student }: Props) {
  const categoryBadgeClass =
    student.category === 'business' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white';

  return (
    <article className="surface-interactive motion-reveal group flex h-full flex-col overflow-hidden rounded-xl">
      <div className="relative">
        <CardImage
          src={student.profile_image}
          alt={student.full_name || 'Student'}
          aspect="square"
          position="top"
          overlay
          rounded="top"
          placeholderIcon={<Briefcase className="h-8 w-8 text-gray-300 dark:text-emerald-700/80" />}
          placeholderLabel="No photo"
        />
        <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryBadgeClass}`}>
          {categoryLabel(student.category)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 dark:text-emerald-50">{student.full_name}</h3>
        <p className="mt-1 line-clamp-1 text-xs text-emerald-600 dark:text-emerald-400">{student.title}</p>
        {student.location ? (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-400 dark:text-emerald-400/70">
            <MapPin className="h-3 w-3" aria-hidden />
            {student.location}
          </p>
        ) : null}
        <div className="mt-auto">
          <Link href={`/community/students/${student.id}`} className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300">
            View Profile
          </Link>
        </div>
      </div>
    </article>
  );
}
