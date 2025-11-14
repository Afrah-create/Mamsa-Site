import Image from 'next/image';
import { fetchActiveEvents, type Event } from '@/lib/public-content';
import { formatDate, formatTime } from '@/lib/public-content-utils';

export const revalidate = 60;

export default async function EventsPage() {
  const { data: events, error } = await fetchActiveEvents();

  return (
    <>
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 text-white -mt-16 pt-20 sm:pt-24">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
          <img
            src="/images/IMG-20250408-WA0074.jpg"
            alt="MAMSA Events"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/85 via-emerald-600/80 to-emerald-500/85" />
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-12 text-center sm:gap-6 sm:px-8 sm:py-16 md:px-10 md:py-20 lg:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 sm:text-sm">Events</p>
          <h1 className="text-2xl font-bold drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">Upcoming Activities & Gatherings</h1>
          <p className="mx-auto max-w-2xl text-sm text-white/95 sm:text-base drop-shadow-md">
            Join fellow Madi students at Makerere in workshops, outreach programs, and community celebrations hosted by MAMSA.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12">

      {error && (
        <div className="mt-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          We couldn&apos;t load the events calendar. Please refresh or try again later.
        </div>
      )}

      <div className="mt-12 space-y-6">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <p className="text-lg font-semibold text-gray-700">No upcoming events</p>
            <p className="mt-2 text-sm text-gray-500">
              When new events are published in the admin panel, they will appear here automatically.
            </p>
          </div>
        ) : (
          events.map((event: Event) => (
            <article
              key={event.id}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-56 w-full overflow-hidden bg-gray-100 sm:h-64">
                {event.featured_image ? (
                  <Image
                    src={event.featured_image}
                    alt={event.title}
                    fill
                    className="object-cover transition duration-500 hover:scale-105"
                    sizes="(min-width: 1024px) 600px, 100vw"
                    priority={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white">
                    <span className="text-sm font-semibold uppercase tracking-wide">MAMSA Event</span>
                  </div>
                )}
                <div className="absolute inset-x-4 bottom-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 shadow">
                    {event.status || 'Upcoming'}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 shadow">
                    {formatDate(event.date)}
                  </span>
                </div>
              </div>

              <div className="space-y-4 px-6 py-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-gray-900">{event.title}</h2>
                  <p className="text-sm text-gray-600">
                    {event.description || 'More details about this event will be shared soon.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  {event.time && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                      <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 5a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L10 8.586V5z" />
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-14a6 6 0 100 12A6 6 0 0010 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {formatTime(event.time)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                    <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.899 5.05 13.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {event.location || 'Venue to be announced'}
                  </span>
                  {event.organizer && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                      <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 7H7v6h6V7z" />
                        <path
                          fillRule="evenodd"
                          d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm2 4a2 2 0 012-2h2a2 2 0 012 2v2.586l1.293 1.293a1 1 0 11-1.414 1.414L13 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L11.586 10H11a2 2 0 01-2-2V7H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {event.organizer}
                    </span>
                  )}
                  {event.contact_email && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                      <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.94 6.94a2 2 0 00-.586 1.414v3.292a2 2 0 00.586 1.414l2.886 2.886A2 2 0 007.24 16h5.518a2 2 0 001.414-.586l2.886-2.886a2 2 0 00.586-1.414V8.354a2 2 0 00-.586-1.414l-2.886-2.886A2 2 0 0012.758 3H7.24a2 2 0 00-1.414.586L2.94 6.94zm12.513-.513L12.88 9H7.12L4.547 6.427 7.24 3.734h5.518l2.694 2.693z" />
                      </svg>
                      {event.contact_email}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
      </div>
    </>
  );
}

