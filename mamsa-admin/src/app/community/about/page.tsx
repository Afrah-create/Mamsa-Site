import Image from 'next/image';
import Link from 'next/link';
import OrgChart from '@/components/OrgChart';
import { ABOUT_SECTIONS, fetchAboutSnapshot, fetchLeadership } from '@/lib/public-content';

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

const FALLBACK_ABOUT_TEXT =
  'Our story is still being written. Stay tuned as we publish more about the history, mission, vision, and values of MAMSA.';

export default async function CommunityAboutPage() {
  const [{ data: about, error: aboutError }, { data: leaders, error: leadershipError }] = await Promise.all([
    fetchAboutSnapshot(),
    fetchLeadership(50),
  ]);

  const hasError = Boolean(aboutError);
  const sectionParagraphs = ABOUT_SECTIONS.reduce<Record<SectionKey, ReturnType<typeof splitIntoParagraphs>>>(
    (acc, key) => {
      acc[key] = splitIntoParagraphs(about[key]);
      return acc;
    },
    {} as Record<SectionKey, ReturnType<typeof splitIntoParagraphs>>
  );
  const secondarySections = ABOUT_SECTIONS.filter((key): key is SectionKey => key !== 'history');
  const highlightSections: SectionKey[] = ['mission', 'vision', 'objectives'];

  return (
    <>
      <header className="relative overflow-hidden border-b border-emerald-100 pb-12 pt-20 -mt-16 sm:pt-24">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 min-h-[500px] sm:min-h-[600px] lg:min-h-[700px]">
          <Image
            src="/images/About.jpg"
            alt="MAMSA Community"
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/85 via-emerald-600/80 to-emerald-500/85" />
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 sm:gap-10 sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:gap-16 lg:py-16">
          <div className="space-y-4 text-center lg:text-left text-white sm:space-y-6">
            <p className="inline-flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm sm:text-sm">
              About MAMSA
            </p>
            <h1 className="text-pretty text-2xl font-semibold text-white drop-shadow-lg sm:text-3xl lg:text-[2.6rem]">
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
        <div className="mx-auto mt-6 max-w-4xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900">Some Content May Be Temporarily Unavailable</h3>
              <p className="mt-1 text-sm text-amber-800">
                We&apos;re experiencing a brief issue loading some sections of this page. We&apos;ve displayed all the information we could load. Please refresh the page in a moment to see the complete content, or check back shortly.
              </p>
            </div>
          </div>
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

      <section className="mx-auto max-w-6xl px-6 pb-16 sm:px-10 lg:pb-20">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-6 sm:p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Leadership Hierarchy</h2>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Explore the MAMSA leadership structure from top roles to team representatives.
            </p>
          </div>

          {leadershipError ? (
            <div className="mx-auto mt-6 max-w-4xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-left shadow-sm">
              <p className="text-sm font-semibold text-amber-900">Leadership chart is temporarily unavailable.</p>
              <p className="mt-1 text-sm text-amber-800">Please refresh this page in a moment.</p>
            </div>
          ) : (
            <div className="mt-4">
              <OrgChart leaders={leaders} />
            </div>
          )}
          
        </div>
      </section>
    </>
  );
}

