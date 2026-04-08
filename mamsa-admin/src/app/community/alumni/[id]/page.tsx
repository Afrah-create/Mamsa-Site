import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchPublishedAlumniById, type NotableAlumnus } from '@/lib/public-content';

export const revalidate = 300;

type PageProps = {
  params: Promise<{ id: string }>;
};

function socialLinksList(alumnus: NotableAlumnus) {
  const links: Array<{ label: string; href: string }> = [];
  const p = alumnus.profile_links;
  if (p?.linkedin) links.push({ label: 'LinkedIn', href: p.linkedin });
  if (p?.twitter) links.push({ label: 'Twitter / X', href: p.twitter });
  if (p?.website) links.push({ label: 'Website', href: p.website });
  return links;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id)) {
    return { title: 'Alumni | MAMSA' };
  }
  const { data } = await fetchPublishedAlumniById(id);
  if (!data) {
    return { title: 'Alumni | MAMSA' };
  }
  return {
    title: `${data.full_name} | Notable Alumni | MAMSA`,
    description: data.biography?.slice(0, 160) || data.achievements?.slice(0, 160) || undefined,
  };
}

export default async function AlumniProfilePage({ params }: PageProps) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const { data: alumnus, error } = await fetchPublishedAlumniById(id);
  if (error || !alumnus) {
    notFound();
  }

  const links = socialLinksList(alumnus);
  const bioParagraphs = alumnus.biography?.trim()
    ? alumnus.biography.trim().split(/\n{2,}/).map((p) => p.trim())
    : [];
  const achievementParagraphs = alumnus.achievements?.trim()
    ? alumnus.achievements.trim().split(/\n{2,}/).map((p) => p.trim())
    : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <nav className="text-sm text-emerald-600">
        <Link href="/" className="hover:text-emerald-700">
          Home
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <Link href="/community/alumni" className="hover:text-emerald-700">
          Alumni
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-500">{alumnus.full_name}</span>
      </nav>

      <header className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {alumnus.featured && (
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Featured
            </span>
          )}
          {alumnus.graduation_year != null && (
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Class of {alumnus.graduation_year}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{alumnus.full_name}</h1>
        <p className="text-lg font-medium text-emerald-700">
          {[alumnus.current_position, alumnus.organization].filter(Boolean).join(' • ') ||
            alumnus.specialty ||
            'MAMSA alum'}
        </p>
        {alumnus.specialty && (alumnus.current_position || alumnus.organization) && (
          <p className="text-sm text-gray-600">{alumnus.specialty}</p>
        )}
      </header>

      {alumnus.image_url && (
        <div className="relative mt-10 w-full shrink-0 overflow-hidden rounded-3xl border border-gray-100 bg-gray-100">
          <div className="w-full pb-[56.25%] sm:pb-[45%]" aria-hidden />
          <Image
            src={alumnus.image_url}
            alt={alumnus.full_name}
            fill
            className="object-cover object-center"
            sizes="(min-width: 1024px) 896px, 100vw"
            priority
          />
        </div>
      )}

      {links.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          {links.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              {item.label}
              <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none">
                <path
                  d="M3 9L9 3M9 3H4.5M9 3V7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          ))}
        </div>
      )}

      {bioParagraphs.length > 0 && (
        <section className="prose prose-emerald mt-10 max-w-none">
          <h2 className="text-xl font-semibold text-gray-900">Biography</h2>
          <div className="mt-4 space-y-4 text-gray-700">
            {bioParagraphs.map((paragraph, i) => (
              <p key={i} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      )}

      {achievementParagraphs.length > 0 && (
        <section className="prose prose-emerald mt-10 max-w-none">
          <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
          <div className="mt-4 space-y-4 text-gray-700">
            {achievementParagraphs.map((paragraph, i) => (
              <p key={i} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      )}

      {bioParagraphs.length === 0 && achievementParagraphs.length === 0 && (
        <p className="mt-10 text-gray-600">More about this alum will be added soon.</p>
      )}

      <div className="mt-14 border-t border-gray-100 pt-8">
        <Link
          href="/community/alumni"
          className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          ← Back to all alumni
        </Link>
      </div>
    </div>
  );
}
