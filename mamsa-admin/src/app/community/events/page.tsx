import { fetchActiveEvents, type Event } from '@/lib/public-content';
import { formatDate, formatTime } from '@/lib/public-content-utils';

export const revalidate = 60;

export default async function EventsPage() {
  const { data: events, error } = await fetchActiveEvents();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Events</p>
        <h1 className="text-4xl font-bold text-gray-900">Upcoming Activities & Gatherings</h1>
        <p className="text-base text-gray-600">
          Join fellow medical students in workshops, outreach programs, and community celebrations hosted by MAMSA.
        </p>
      </div>

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
            <div key={event.id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    {event.status || 'Upcoming'}
                  </p>
                  <h2 className="text-2xl font-semibold text-gray-900">{event.title}</h2>
                  <p className="text-sm text-gray-600">
                    {event.description || 'More details about this event will be shared soon.'}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <p className="font-semibold">{formatDate(event.date)}</p>
                  {event.time && <p>{formatTime(event.time)}</p>}
                  <p className="mt-1 text-emerald-600/90">{event.location || 'Venue to be announced'}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500">
                {event.organizer && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                    <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 7H7v6h6V7z" />
                      <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm2 4a2 2 0 012-2h2a2 2 0 012 2v2.586l1.293 1.293a1 1 0 11-1.414 1.414L13 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L11.586 10H11a2 2 0 01-2-2V7H7z" clipRule="evenodd" />
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
          ))
        )}
      </div>
    </div>
  );
}

