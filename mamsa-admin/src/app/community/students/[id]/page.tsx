import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Briefcase, ExternalLink, Globe, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import {
  getActiveStudentProductsByStudentId,
  getSkilledStudentById,
  type SkilledStudentProductPublic,
  type SkilledStudentPublic,
} from '@/lib/public-content';
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
  let products: SkilledStudentProductPublic[] = [];
  try {
    const [studentResult, productsResult] = await Promise.all([
      getSkilledStudentById(id),
      getActiveStudentProductsByStudentId(id),
    ]);
    student = studentResult;
    products = productsResult;
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
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:max-w-6xl lg:px-10 lg:py-16 xl:max-w-7xl 2xl:max-w-[1320px]">
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

      <header className="mt-6 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/40 px-6 py-7 shadow-sm sm:px-8 sm:py-8 lg:px-10 lg:py-8 xl:py-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600 shadow-sm ring-1 ring-gray-200">
            <Briefcase className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
            {categoryLabel(student.category)}
          </span>
          {student.is_featured && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Featured listing
            </span>
          )}
        </div>
        <h1 className="mt-4 text-balance text-3xl font-bold text-gray-900 sm:text-4xl lg:text-[2.3rem] xl:text-[2.6rem]">{student.full_name}</h1>
        <p className="mt-2 text-lg font-medium text-emerald-700 sm:text-xl">{student.title}</p>
        {student.location ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="h-4 w-4 text-emerald-500" />
            {student.location}
          </p>
        ) : null}
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-8 xl:grid-cols-[340px_minmax(0,1fr)] xl:gap-10 2xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5 2xl:sticky 2xl:top-24">
          <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-gray-100 bg-emerald-50 shadow-sm lg:mx-0">
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

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contact</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${student.email}`}
                  className="inline-flex items-center gap-2 font-medium text-emerald-700 transition hover:text-emerald-800"
                >
                  <Mail className="h-4 w-4 text-emerald-600" />
                  {student.email}
                </a>
              </li>
              {student.phone ? (
                <li>
                  <a
                    href={`tel:${student.phone.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-2 text-gray-700 transition hover:text-emerald-700"
                  >
                    <Phone className="h-4 w-4 text-emerald-600" />
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
                    className="inline-flex items-center gap-2 font-medium text-emerald-700 transition hover:text-emerald-800"
                  >
                    <Globe className="h-4 w-4 text-emerald-600" />
                    Visit website
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </li>
              ) : null}
            </ul>
          </section>

          {social.length > 0 && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Social links</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {social.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
                    >
                      {item.label}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <div className="min-w-0 space-y-7 2xl:space-y-8">
          {bioParagraphs.length > 0 && (
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:p-7">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">About</h2>
              <div className="mt-3 max-w-[70ch] space-y-3">
                {bioParagraphs.map((p, i) => (
                  <p key={`bio-${i}`} className="leading-relaxed text-gray-700">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          )}

          {descParagraphs.length > 0 && (
            <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:p-7">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Services &amp; details</h2>
              <div className="mt-3 max-w-[70ch] space-y-3">
                {descParagraphs.map((p, i) => (
                  <p key={`desc-${i}`} className="leading-relaxed text-gray-700">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          )}

          {bioParagraphs.length === 0 && descParagraphs.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500 lg:p-7">
              Profile details are being updated. Check back soon.
            </section>
          ) : null}
        </div>
      </div>

      <section className="mt-12 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Products & services</h2>
          {products.length > 0 ? (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{products.length} listed</span>
          ) : null}
        </div>

        {products.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            This profile has not listed products yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {products.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative">
                  <CardImage
                    src={product.image_url}
                    alt={product.name}
                    aspect="video"
                    position="center"
                    rounded="top"
                    placeholderIcon={<UserRound className="h-6 w-6 text-gray-300" />}
                    placeholderLabel="No product image"
                  />
                  {product.is_featured ? (
                    <span className="absolute left-2 top-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                      Featured
                    </span>
                  ) : null}
                </div>
                <div className="space-y-2 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{product.name}</h3>
                    {product.price ? (
                      <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        {product.currency} {product.price}
                      </span>
                    ) : null}
                  </div>
                  {product.category ? <p className="text-xs uppercase tracking-wide text-gray-500">{product.category}</p> : null}
                  {product.description ? (
                    <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">{product.description}</p>
                  ) : (
                    <p className="text-sm text-gray-500">No additional description.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8">
        <Link
          href="/community/students"
          className="inline-flex items-center text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          ← Back to skilled students
        </Link>
      </div>
    </div>
  );
}
