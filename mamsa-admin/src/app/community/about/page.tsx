import Image from 'next/image';
import Link from 'next/link';
import { ABOUT_SECTIONS, fetchAboutSnapshot, fetchPublishedAlumni, type NotableAlumnus } from '@/lib/public-content';

export const revalidate = 180;

type SectionKey = typeof ABOUT_SECTIONS[number];

const SECTION_LABELS: Record<SectionKey, string> = {
  history: 'Our Story',
  mission: 'Our Mission',
  vision: 'Our Vision',
  values: 'Core Values',
  objectives: 'Strategic Objectives',
};

const SECTION_DESCRIPTIONS: Partial<Record<SectionKey, string>> = {
  history: 'Discover the milestones and moments that have shaped MAMSA into the community it is today.',
  mission: 'The purpose that guides our daily work and the impact we strive to deliver.',
  vision: 'Where we are heading and the future we imagine for medical students in our community.',
  values: 'The principles and commitments that anchor our decisions and culture.',
  objectives: 'Key focus areas that help us translate our purpose into tangible outcomes.',
};

const splitIntoParagraphs = (value: string | undefined) =>
  value?.trim()
    ? value
        .trim()
        .split(/\n{2,}/)
        .map((paragraph, index) => ({ id: index, text: paragraph.trim() }))
    : [];

const buildAlumniSocialLinks = (alumnus: NotableAlumnus) => {
  const links: Array<{ label: string; href: string }> = [];
  const { profile_links: profileLinks } = alumnus;

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
};

const FALLBACK_ABOUT_TEXT =
  'Our story is still being written. Stay tuned as we publish more about the history, mission, vision, and values of MAMSA.';

export default async function CommunityAboutPage() {
  const [{ data: about, error: aboutError }, { data: alumni, error: alumniError }] = await Promise.all([
    fetchAboutSnapshot(),
    fetchPublishedAlumni(),
  ]);

  const hasError = Boolean(aboutError || alumniError);
  const sectionParagraphs = ABOUT_SECTIONS.reduce<Record<SectionKey, ReturnType<typeof splitIntoParagraphs>>>(
    (acc, key) => {
      acc[key] = splitIntoParagraphs(about[key]);
      return acc;
    },
    {} as Record<SectionKey, ReturnType<typeof splitIntoParagraphs>>
  );
  const secondarySections = ABOUT_SECTIONS.filter((key): key is SectionKey => key !== 'history');
  const highlightSections: SectionKey[] = ['mission', 'vision', 'objectives'];
  const hasAlumni = alumni.length > 0;

  return (
    <>
      <header className="relative overflow-hidden border-b border-emerald-100 pb-12 pt-8 -mt-16">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <Image
            src="/images/About.jpg"
            alt="MAMSA Community"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/85 via-emerald-600/80 to-emerald-500/85" />
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 sm:px-10 lg:flex-row lg:items-center lg:gap-16">
          <div className="space-y-6 text-center lg:text-left text-white">
            <p className="inline-flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm sm:text-sm">
              About MAMSA
            </p>
            <h1 className="text-pretty text-3xl font-semibold text-white drop-shadow-lg sm:text-[2.6rem]">
              Our story, purpose, and people.
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-white/95 sm:text-base lg:mx-0 lg:text-lg drop-shadow-md">
              From student leaders to alumni champions, MAMSA unites students from the Madi region in West Nile studying at Makerere University. We stand for collaboration, service, and academic excellence. Discover how our mission and values have grown with every generation.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/community/updates"
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-emerald-700 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
              >
                What&apos;s New
              </Link>
              <Link
                href="/community/events"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/20 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
              >
                Join an Event
              </Link>
            </div>
          </div>
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className="relative h-64 sm:h-72">
              <Image
                src="/images/About.jpg"
                alt="Makerere Ivory Tower"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 380px, 100vw"
                priority
              />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/90 p-4 text-sm text-emerald-800 shadow-lg backdrop-blur">
                <p className="font-semibold">Celebrating Madi students at Makerere</p>
                <p className="mt-1 text-xs text-emerald-700/70">
                  MAMSA connects students from the Madi region in West Nile, mentors, and alumni to support each other&apos;s academic journey and community development.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {hasError && (
        <div className="mx-auto mt-6 max-w-4xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Some sections may be unavailable right now. We&apos;re showing the latest information we could load.
        </div>
      )}

      <section className="mx-auto max-w-6xl px-6 py-14 sm:px-10 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.2fr,1fr] lg:gap-16">
            <article className="space-y-6 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-7 shadow-sm sm:p-9">
              <h2 className="text-3xl font-semibold text-emerald-800 sm:text-[2.2rem]">History & Heritage</h2>
              {sectionParagraphs.history.length > 0 ? (
                <div className="space-y-4 text-pretty text-sm leading-relaxed text-emerald-800/90 sm:text-base">
                  {sectionParagraphs.history.map((paragraph) => (
                    <p key={paragraph.id}>{paragraph.text}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-emerald-800/80 sm:text-base">{FALLBACK_ABOUT_TEXT}</p>
              )}
            </article>

            <div className="grid gap-5 sm:grid-cols-2">
              {secondarySections.map((key) => (
                  <article
                    key={key}
                    className="flex flex-col rounded-3xl border border-gray-100 bg-white px-6 py-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3 text-emerald-600">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold uppercase tracking-wide">
                        {SECTION_LABELS[key][0]}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">{SECTION_LABELS[key]}</h3>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-wide text-emerald-500">
                      {SECTION_DESCRIPTIONS[key] ?? 'Guiding principle.'}
                    </p>
                    {sectionParagraphs[key].length > 0 ? (
                      <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-600">
                        {sectionParagraphs[key].map((paragraph) => (
                          <p key={paragraph.id}>{paragraph.text}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm leading-relaxed text-gray-600">
                        Content coming soon. Check back for updates from the MAMSA executive.
                      </p>
                    )}
                  </article>
                ))}
            </div>
          </div>
        </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-20">
          <div className="flex flex-col gap-4 text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Community Champions</p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-[2.2rem]">Notable Alumni</h2>
            <p className="max-w-3xl text-sm text-gray-600 sm:text-base">
              Our alumni embody the spirit of MAMSA beyond campus. They lead in various fields and sectors—creating ripple effects that inspire current Madi students at Makerere to keep aiming higher.
            </p>
          </div>

          {hasAlumni ? (
            <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {alumni.map((alumnus) => {
                const socialLinks = buildAlumniSocialLinks(alumnus);
                return (
                  <article
                    key={alumnus.id}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-emerald-50">
                      {alumnus.image_url ? (
                        <Image
                          src={alumnus.image_url}
                          alt={alumnus.full_name}
                          fill
                          className="object-contain p-4 transition duration-500 group-hover:scale-105"
                          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-emerald-100 text-emerald-600">
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
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-700">{alumnus.full_name}</h3>
                        <p className="text-sm font-medium text-emerald-600">
                          {[alumnus.current_position, alumnus.organization].filter(Boolean).join(' • ') || alumnus.specialty || 'Community Leader'}
                        </p>
                        {alumnus.graduation_year && (
                          <p className="text-xs uppercase tracking-wide text-gray-500">Class of {alumnus.graduation_year}</p>
                        )}
                      </div>
                      <p className="flex-1 text-sm leading-relaxed text-gray-600">
                        {alumnus.biography?.trim() || alumnus.achievements?.trim() || 'Profile coming soon.'}
                      </p>
                      {socialLinks.length > 0 && (
                        <div className="flex flex-wrap gap-3 text-sm">
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
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
              <h3 className="text-lg font-semibold text-gray-800">Notable alumni profiles will be featured here soon.</h3>
              <p className="mt-2 text-sm text-gray-500">
                Our team is curating inspiring stories from the MAMSA alumni network. Check back later for highlights.
              </p>
            </div>
          )}
      </section>
    </>
  );
}

