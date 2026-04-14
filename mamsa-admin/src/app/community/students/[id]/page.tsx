import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { UserRound } from 'lucide-react';
import { getSkilledStudentById, type SkilledStudentPublic } from '@/lib/public-content';
import { CardImage } from '@/components/ui/CardImage';

export const revalidate = 300;

type PageProps = {
  params: Promise<{ id: string }>;
};

function socialEntries(links: SkilledStudentPublic['social_links']): Array<{ label: string; href: string }> {
  if (!links) return [];
  const out: Array<{ label: string; href: string }> = [];
  for (const [key, val] of Object.entries(links)) {
    if (typeof val !== 'string') continue;
    const href = val.trim();
    if (!href.startsWith('http://') && !href.startsWith('https://')) continue;
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    out.push({ label, href });
  }
  return out;
}

function categoryLabel(category: SkilledStudentPublic['category']) {
  return category === 'business' ? 'Business' : 'Skill';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id)) {
    return { title: 'Skilled students | MAMSA' };
  }
  let student: SkilledStudentPublic | null = null;
  try {
    student = await getSkilledStudentById(id);
  } catch {
    return { title: 'Skilled students | MAMSA' };
  }
  if (!student) {
    return { title: 'Skilled students | MAMSA' };
  }
  return {
    title: `${student.full_name} | Skilled students | MAMSA`,
    description: student.bio?.slice(0, 160) || student.description?.slice(0, 160) || undefined,
  };
}

export default async function SkilledStudentProfilePage({ params }: PageProps) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id)) {
    notFound();
  }

  let student: SkilledStudentPublic | null = null;
  try {
    student = await getSkilledStudentById(id);
  } catch {
    notFound();
  }

  if (!student) {
    notFound();
  }

  const social = socialEntries(student.social_links);
  const bioParagraphs = student.bio?.trim()
    ? student.bio.trim().split(/\n{2,}/).map((p) => p.trim())
    : [];
  const descParagraphs = student.description?.trim()
    ? student.description.trim().split(/\n{2,}/).map((p) => p.trim())
    : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <nav className="text-sm text-emerald-600">
        <Link href="/" className="hover:text-emerald-700">
          Home
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <Link href="/community/students" className="hover:text-emerald-700">
          Skilled students
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-500">{student.full_name}</span>
      </nav>

      <header className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {student.is_featured && (
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Featured
            </span>
          )}
          <span className="inline-flex rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
            {categoryLabel(student.category)}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{student.full_name}</h1>
        <p className="text-lg font-medium text-emerald-700">{student.title}</p>
        {student.location ? <p className="text-sm text-gray-500">{student.location}</p> : null}
      </header>

      <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-start">
        <div className="relative mx-auto w-full max-w-xs shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-emerald-50 shadow-sm md:mx-0">
          <CardImage
            src={student.profile_image}
            alt={student.full_name || 'Student'}
            aspect="portrait"
            position="top"
            rounded="all"
            placeholderIcon={<UserRound className="h-8 w-8 text-gray-300" />}
            placeholderLabel="No photo"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-8">
          {bioParagraphs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">About</h2>
              {bioParagraphs.map((p, i) => (
                <p key={`bio-${i}`} className="text-gray-700 leading-relaxed">
                  {p}
                </p>
              ))}
            </section>
          )}

          {descParagraphs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Services &amp; details</h2>
              {descParagraphs.map((p, i) => (
                <p key={`desc-${i}`} className="text-gray-700 leading-relaxed">
                  {p}
                </p>
              ))}
            </section>
          )}

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Contact</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href={`mailto:${student.email}`} className="font-medium text-emerald-600 hover:text-emerald-800">
                  {student.email}
                </a>
              </li>
              {student.phone ? (
                <li>
                  <a href={`tel:${student.phone.replace(/\s+/g, '')}`} className="text-gray-700 hover:text-emerald-700">
                    {student.phone}
                  </a>
                </li>
              ) : null}
              {student.website_url ? (
                <li>
                  <a
                    href={student.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-600 hover:text-emerald-800"
                  >
                    Website
                  </a>
                </li>
              ) : null}
            </ul>
          </section>

          {social.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Links</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {social.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
