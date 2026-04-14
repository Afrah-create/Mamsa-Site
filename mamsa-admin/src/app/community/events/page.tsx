import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';
import { fetchActiveEvents, type Event } from '@/lib/public-content';
import { formatDate, formatTime } from '@/lib/public-content-utils';
import { CardImage } from '@/components/ui/CardImage';

export const revalidate = 300; // Increase to 5 minutes - events don't change frequently

export default async function EventsPage() {
  // Limit to 50 events per page - add pagination later if needed
  const { data: events, error } = await fetchActiveEvents(50);

  const dateBadge = (value: string | null) => {
    if (!value) return 'TBA';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'TBA';
    return d
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      .toUpperCase();
  };

  return (
    <>
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 text-white -mt-16 pt-20 sm:pt-24">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
          <Image
            src="/images/IMG-20250408-WA0074.jpg"
            alt="MAMSA Events"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
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
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900">Events Calendar Temporarily Unavailable</h3>
              <p className="mt-1 text-sm text-amber-800">
                We could not load events right now. Please refresh and try again.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <p className="text-lg font-semibold text-gray-700">No upcoming events</p>
            <p className="mt-2 text-sm text-gray-500">
              New events will be shown here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event: Event) => (
            <article
              key={event.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="relative">
                <CardImage
                  src={event.featured_image}
                  alt={event.title || 'Event'}
                  aspect="video"
                  position="center"
                  overlay
                  rounded="top"
                  placeholderIcon={<Calendar className="h-8 w-8 text-gray-300" />}
                  placeholderLabel="No image"
                />
                <span className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-xs font-bold text-gray-900 backdrop-blur-sm">
                  {dateBadge(event.date)}
                </span>
              </div>

              <div className="p-4">
                <h2 className="line-clamp-2 text-sm font-semibold text-gray-900">{event.title}</h2>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {event.location || 'Venue to be announced'}
                </p>
                <p className="mt-1 text-xs text-emerald-600">{event.time ? formatTime(event.time) : 'Time to be announced'}</p>
                <div className="mt-2">
                  <Link
                    href={`/community/events/${event.id}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
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
          }
          </div>
        )}
      </div>
      </div>
    </>
  );
}

