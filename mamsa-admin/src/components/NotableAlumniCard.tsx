import Image from 'next/image';
import Link from 'next/link';
import type { NotableAlumnus } from '@/lib/public-content';

function buildAlumniSocialLinks(alumnus: NotableAlumnus) {
  const links: Array<{ label: string; href: string }> = [];
  const profileLinks = alumnus.profile_links;

  if (profileLinks?.linkedin) {
    links.push({ label: 'LinkedIn', href: profileLinks.linkedin });
  }
  if (profileLinks?.twitter) {
    links.push({ label: 'Twitter / X', href: profileLinks.twitter });
  }
  if (profileLinks?.website) {
    links.push({ label: 'Website', href: profileLinks.website });
  }

  return links;
}

type Props = {
  alumnus: NotableAlumnus;
};

export default function NotableAlumniCard({ alumnus }: Props) {
  const socialLinks = buildAlumniSocialLinks(alumnus);
  const preview =
    alumnus.biography?.trim() || alumnus.achievements?.trim() || 'Profile coming soon.';

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative w-full shrink-0 overflow-hidden bg-emerald-50">
        <div className="w-full pb-[75%]" aria-hidden />
        {alumnus.image_url ? (
          <Image
            src={alumnus.image_url}
            alt={alumnus.full_name}
            fill
            className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-100 text-emerald-600">
            <span className="text-sm font-semibold uppercase tracking-wide">MAMSA Alumni</span>
          </div>
        )}
        {alumnus.featured && (
          <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 shadow">
            Featured
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 px-6 py-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 transition group-hover:text-emerald-700">
            <Link
              href={`/community/alumni/${alumnus.id}`}
              className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {alumnus.full_name}
            </Link>
          </h3>
          <p className="text-sm font-medium text-emerald-600">
            {[alumnus.current_position, alumnus.organization].filter(Boolean).join(' • ') ||
              alumnus.specialty ||
              'Community leader'}
          </p>
          {alumnus.graduation_year != null && (
            <p className="text-xs uppercase tracking-wide text-gray-500">Class of {alumnus.graduation_year}</p>
          )}
        </div>
        <p className="line-clamp-4 flex-1 text-sm leading-relaxed text-gray-600">{preview}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 transition hover:bg-emerald-100"
            >
              <span>{link.label}</span>
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
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
          <Link
            href={`/community/alumni/${alumnus.id}`}
            className="inline-flex items-center gap-1 font-semibold text-emerald-600 transition hover:text-emerald-700"
          >
            View profile
            <svg className="h-3 w-3" fill="none" viewBox="0 0 8 8">
              <path
                d="M1 4h5M4 1l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
