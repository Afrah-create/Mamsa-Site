import Image from 'next/image';
import Link from 'next/link';
import PublicFooter from '@/components/PublicFooter';
import PublicNavbar from '@/components/PublicNavbar';
import { fetchHomeContent, formatDate, formatTime } from '@/lib/public-content';

export const revalidate = 60;

export default async function HomePage() {
  const { news, events, leadership, gallery, hasError } = await fetchHomeContent();

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
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-green-700 shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-xl hover:shadow-emerald-900/25 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
                >
                  Admin Login
                </Link>
                <Link
                  href="/community/updates"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-white/60 px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
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
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        Read more
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 8 8">
                          <path d="M1 4h5M4 1l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
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
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.length === 0 ? (
                <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
                  <p className="text-lg font-semibold text-gray-700">No upcoming events right now.</p>
                  <p className="mt-2 text-sm text-gray-500">Check back soon for new opportunities to engage with the community.</p>
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-center justify-between text-sm text-emerald-600">
                      <span className="font-semibold uppercase tracking-wide">{event.status || 'Upcoming'}</span>
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-gray-900">{event.title}</h3>
                    <p className="mt-3 text-sm text-gray-600">
                      {event.description?.slice(0, 160) || 'Details coming soon.'}
                      {event.description && event.description.length > 160 ? '…' : ''}
                    </p>
                    <dl className="mt-6 space-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 2C6.13 2 3 5.13 3 9c0 6 7 11 7 11s7-5 7-11c0-3.87-3.13-7-7-7zM5 9a5 5 0 0110 0c0 2.5-2.5 5.94-5 8.54C7.5 14.94 5 11.5 5 9z" />
                          <path d="M10 5a4 4 0 100 8 4 4 0 000-8z" />
                        </svg>
                        <span>{event.location || 'Venue to be confirmed'}</span>
                      </div>
                      {event.time && (
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-12.75a.75.75 0 011.5 0V10c0 .199-.079.39-.22.53l-2.5 2.5a.75.75 0 01-1.06-1.06l2.28-2.28V5.25z" clipRule="evenodd" />
                          </svg>
                          <span>{formatTime(event.time)}</span>
                        </div>
                      )}
                    </dl>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Leadership</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">Meet the people behind MAMSA</h2>
            </div>
            <Link
              href="/community/leadership"
              className="inline-flex items-center text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
            >
              Meet the full team →
            </Link>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {leadership.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-4 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-lg font-semibold text-gray-700">Leadership profiles are being prepared.</p>
                <p className="mt-2 text-sm text-gray-500">Once published in the admin portal, you&apos;ll see the leadership team here.</p>
              </div>
            ) : (
              leadership.map((member) => (
                <div key={member.id} className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  {member.image_url ? (
                    <span className="relative h-28 w-28 overflow-hidden rounded-full">
                      <Image
                        src={member.image_url}
                        alt={member.name}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    </span>
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-100 text-2xl font-semibold text-emerald-700">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <h3 className="mt-6 text-lg font-semibold text-gray-900">{member.name}</h3>
                  <p className="mt-2 text-sm font-medium text-emerald-600">{member.position || 'Leadership Team'}</p>
                  <p className="mt-3 text-sm text-gray-600 line-clamp-3">{member.bio || 'Biography coming soon.'}</p>
                  {member.department && (
                    <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      {member.department}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-emerald-700">
          <div className="mx-auto max-w-6xl px-6 py-20 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Gallery</p>
                <h2 className="mt-2 text-3xl font-bold">Moments from our journey</h2>
                <p className="mt-3 max-w-xl text-emerald-100">
                  Explore highlights from past events, outreach programs, and student life. New images appear here automatically once they&apos;re published in the admin gallery.
                </p>
              </div>
              <Link
                href="/community/gallery"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
              >
                View full gallery
              </Link>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {gallery.length === 0 ? (
                <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-emerald-300 border-dashed bg-emerald-600/40 p-8 text-center">
                  <p className="text-lg font-semibold">Gallery coming soon.</p>
                  <p className="mt-2 text-sm text-emerald-100">Publish gallery images from the admin panel to showcase events and activities.</p>
                </div>
              ) : (
                gallery.map((item) => (
                  <figure
                    key={item.id}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg transition hover:-translate-y-1 hover:shadow-emerald-900/30"
                  >
                    {item.image_url ? (
                      <div className="relative h-48 w-full overflow-hidden">
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          sizes="(min-width: 1024px) 320px, 100vw"
                          className="object-cover opacity-90 transition group-hover:opacity-100"
                        />
                      </div>
                    ) : (
                      <div className="flex h-48 w-full items-center justify-center bg-emerald-600/60 text-emerald-100">
                        <span className="text-sm font-medium uppercase tracking-wide">Image pending</span>
                      </div>
                    )}
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-black/10 p-4">
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <p className="text-xs text-emerald-100">{item.category || 'MAMSA Community'}</p>
                    </figcaption>
                  </figure>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

