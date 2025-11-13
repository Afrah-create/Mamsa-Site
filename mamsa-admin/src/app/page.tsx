import Image from 'next/image';
import Link from 'next/link';
import PublicFooter from '@/components/PublicFooter';
import PublicNavbar from '@/components/PublicNavbar';
import { fetchHomeContent } from '@/lib/public-content';
import { formatDate } from '@/lib/public-content-utils';
import EventCarousel from '@/components/EventCarousel';

export const revalidate = 60;

export default async function HomePage() {
  const { news, events, leadership, about, hasError } = await fetchHomeContent();
  const hasAboutContent = Object.values(about).some((value) => value?.trim().length);
  const aboutCards = [
    {
      key: 'mission' as const,
      title: 'Our Mission',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18h6m-3 3v-3m-4-4c0 .943.265 1.83.73 2.58.208.333.27.747.162 1.132l-.302 1.093a.75.75 0 00.727.95h6.38a.75.75 0 00.728-.95l-.303-1.093a1.75 1.75 0 01.161-1.132A5 5 0 0012 5a5 5 0 00-5 5z" />
        </svg>
      ),
      accent: 'border-emerald-200',
    },
    {
      key: 'vision' as const,
      title: 'Our Vision',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4m0 10v4m4.95-14.95l-2.828 2.828M9.879 17.657L7.05 20.485M21 12h-4M7 12H3m14.95 4.95l-2.828-2.828M9.879 6.343L7.05 3.515" />
          <circle cx="12" cy="12" r="3.5" />
        </svg>
      ),
      accent: 'border-emerald-200',
    },
    {
      key: 'values' as const,
      title: 'Core Values',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5l8.5 3.5L12 11.5 3.5 8z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10.5v5a2 2 0 001.2 1.84L12 20.5l5.8-3.16A2 2 0 0019 15.5v-5" />
        </svg>
      ),
      accent: 'border-emerald-200',
    },
    {
      key: 'objectives' as const,
      title: 'Strategic Objectives',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16M8 16v-5m4 5V8m4 8v-3" />
        </svg>
      ),
      accent: 'border-emerald-200',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <PublicNavbar />
      <main className="flex-1 pt-24">
        <header className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 text-white">
          <span className="pointer-events-none absolute -left-20 top-[-5rem] h-56 w-56 rounded-full bg-white/15 blur-3xl mix-blend-screen md:-left-28 md:top-[-7rem] lg:h-72 lg:w-72" />
          <span className="pointer-events-none absolute -bottom-20 right-[-3rem] h-60 w-60 rounded-full bg-emerald-400/20 blur-3xl mix-blend-screen md:-bottom-28 md:right-[-5rem] lg:h-80 lg:w-80" />
          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:flex-row lg:items-center lg:justify-between lg:gap-14 lg:px-10 lg:py-16">
            <div className="space-y-5 text-center lg:max-w-lg lg:text-left xl:space-y-6">
              <p className="mx-auto inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-emerald-50 shadow-sm backdrop-blur-sm sm:px-5 sm:py-2 sm:text-xs lg:mx-0">
                Madi Makerere University Students Association
              </p>
              <h1 className="text-balance text-[1.9rem] font-semibold leading-tight text-white drop-shadow-sm sm:text-[2.4rem] md:text-[2.9rem] md:leading-tight lg:text-[3.4rem] lg:leading-[1.05] xl:text-[3.6rem]">
                Empowering medical students to lead, learn, and serve.
              </h1>
              <p className="mx-auto max-w-2xl text-pretty text-sm text-emerald-50/95 sm:text-base lg:mx-0 lg:text-lg">
                Stay updated with the latest news, events, and leadership insights from MAMSA. Explore our community-driven initiatives and discover how you can participate.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start lg:gap-3">
                <Link
                  href="/community/updates"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-green-700 shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-xl hover:shadow-emerald-900/25 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
                >
                  Explore Latest Updates
                </Link>
              </div>
            </div>
            <div className="relative flex w-full items-center justify-center lg:max-w-md">
              <div className="relative w-full overflow-hidden rounded-[24px] border border-white/20 bg-white/10 shadow-2xl backdrop-blur">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/35 via-white/0 to-white/10" />
                <div className="relative flex flex-col gap-4 p-4 sm:p-5 md:p-6">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-emerald-600/25 blur-2xl" />
                    <div className="relative h-[200px] overflow-hidden rounded-2xl border border-white/40 bg-white/95 shadow-lg sm:h-[220px] lg:h-[230px]">
                      <Image
                        src="/images/ivory tower2.jpeg"
                        alt="Makerere Ivory Tower"
                        fill
                        sizes="(min-width: 1024px) 400px, 100vw"
                        priority
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 rounded-2xl border border-white/60 bg-white/95 p-5 text-green-900 shadow-inner sm:gap-5">
                    <h2 className="text-left text-lg font-semibold text-emerald-700 sm:text-xl">This Week at MAMSA</h2>
                    <p className="text-left text-sm text-emerald-800/80 sm:text-base">
                      Highlights from our vibrant community — fresh stories, upcoming events, and the leaders who make it happen.
                    </p>
                    <dl className="grid grid-cols-3 gap-3 text-center text-sm font-medium text-emerald-900">
                      <div className="rounded-xl bg-emerald-50/80 px-3 py-2 sm:px-4 sm:py-3">
                        <dt className="text-xs uppercase tracking-wide text-emerald-500 sm:text-[0.7rem]">Stories</dt>
                        <dd className="text-xl font-bold sm:text-2xl">{news.length}</dd>
                      </div>
                      <div className="rounded-xl bg-emerald-50/80 px-3 py-2 sm:px-4 sm:py-3">
                        <dt className="text-xs uppercase tracking-wide text-emerald-500 sm:text-[0.7rem]">Events</dt>
                        <dd className="text-xl font-bold sm:text-2xl">{events.length}</dd>
                      </div>
                      <div className="rounded-xl bg-emerald-50/80 px-3 py-2 sm:px-4 sm:py-3">
                        <dt className="text-xs uppercase tracking-wide text-emerald-500 sm:text-[0.7rem]">Leaders</dt>
                        <dd className="text-xl font-bold sm:text-2xl">{leadership.length}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {hasAboutContent && (
          <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-14">
            <div className="grid gap-8 lg:grid-cols-[1.2fr,1fr] lg:gap-10">
              <div className="space-y-4 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 shadow-sm sm:p-7">
                <h2 className="text-2xl font-semibold text-emerald-800 sm:text-[2.1rem]">Who We Are</h2>
                <p className="text-pretty text-sm text-emerald-800/90 sm:text-base leading-relaxed">
                  {about.history?.trim() || 'Our story is being crafted. Check back soon to learn more about MAMSA’s journey.'}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {aboutCards.map((card) => (
                  <article
                    key={card.key}
                    className={`rounded-3xl border bg-white px-5 py-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${card.accent}`}
                  >
                    <div className="flex items-center gap-3 text-emerald-600">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        {card.icon}
                      </span>
                      <h3 className="text-base font-semibold text-gray-900">{card.title}</h3>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                      {about[card.key]?.trim() || 'Content coming soon.'}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {hasError && (
          <div className="mx-auto mt-6 max-w-4xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            We could not load all live content right now. Showing whatever is available.
          </div>
        )}

        <section id="news" className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">News & Stories</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">Latest updates from MAMSA</h2>
            </div>
            <Link
              href="/community/updates"
              className="inline-flex items-center text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
            >
              View all updates →
            </Link>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {news.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-lg font-semibold text-gray-700">No published news articles yet.</p>
                <p className="mt-2 text-sm text-gray-500">Once articles are published in the admin portal, they will appear here automatically.</p>
              </div>
            ) : (
              news.map((article) => (
                <article
                  key={article.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {article.featured_image ? (
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={article.featured_image}
                        alt={article.title}
                        fill
                        sizes="(min-width: 1024px) 320px, 100vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-emerald-50 text-emerald-500">
                      <span className="text-sm font-semibold uppercase tracking-wide">MAMSA News</span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col space-y-4 px-6 py-6">
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                        {formatDate(article.published_at)}
                      </p>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-700">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {article.excerpt || 'No summary available for this story yet.'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{article.author || 'MAMSA Editorial Team'}</span>
                      <Link
                        href={`/community/updates/${article.id}`}
                        className="inline-flex items-center gap-1 text-emerald-600 transition hover:text-emerald-700"
                      >
                        Read more
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 8 8">
                          <path d="M1 4h5M4 1l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section id="events" className="bg-gray-50">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Events</p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900">What&apos;s happening next</h2>
              </div>
              <Link
                href="/community/events"
                className="inline-flex items-center text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
              >
                View full calendar →
              </Link>
            </div>
            <div className="mt-10">
              <EventCarousel events={events} />
            </div>
          </div>
        </section>

      </main>
      <PublicFooter />
    </div>
  );
}

