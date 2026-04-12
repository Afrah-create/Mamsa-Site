import Image from 'next/image';
import Link from 'next/link';
import type { SkilledStudentPublic } from '@/lib/public-content';

function categoryLabel(category: SkilledStudentPublic['category']) {
  return category === 'business' ? 'Business' : 'Skill';
}

type Props = {
  student: SkilledStudentPublic;
};

export default function SkilledStudentCard({ student }: Props) {
  const preview =
    student.bio?.trim() || student.description?.trim() || 'Profile and services coming soon.';

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative w-full shrink-0 overflow-hidden bg-emerald-50">
        <div className="w-full pb-[75%]" aria-hidden />
        {student.profile_image ? (
          <Image
            src={student.profile_image}
            alt={student.full_name}
            fill
            className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-100 text-emerald-600">
            <span className="text-sm font-semibold uppercase tracking-wide">MAMSA</span>
          </div>
        )}
        {student.is_featured && (
          <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 shadow">
            Featured
          </span>
        )}
        <span className="absolute bottom-4 right-4 inline-flex rounded-full bg-emerald-900/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {categoryLabel(student.category)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-6 py-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 transition group-hover:text-emerald-700">
            <Link
              href={`/community/students/${student.id}`}
              className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {student.full_name}
            </Link>
          </h3>
          <p className="text-sm font-medium text-emerald-700">{student.title}</p>
          {student.location ? (
            <p className="text-xs text-gray-500">{student.location}</p>
          ) : null}
        </div>
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">{preview}</p>
        <div>
          <Link
            href={`/community/students/${student.id}`}
            className="inline-flex items-center text-sm font-semibold text-emerald-600 transition hover:text-emerald-800"
          >
            View profile
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
