import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchEventById } from '@/lib/public-content';
import { formatDate, formatTime } from '@/lib/public-content-utils';

type PageProps = {
  params: Promise<{ id: string }>;
};

export const revalidate = 180;

export default async function EventDetailPage({ params }: PageProps) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isFinite(id)) {
    notFound();
  }

  const { data: event } = await fetchEventById(id);

  if (!event) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <nav className="text-sm text-emerald-600">
        <Link href="/" className="hover:text-emerald-700">
          Home
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <Link href="/community/events" className="hover:text-emerald-700">
          Events
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-500">{event.title}</span>
      </nav>

      <header className="mt-8 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{formatDate(event.date)}</p>
        <h1 className="text-4xl font-bold text-gray-900">{event.title}</h1>
        <p className="text-sm text-gray-500">{event.organizer || 'MAMSA Events Team'}</p>
      </header>

      {event.featured_image && (
        <div className="mt-10 overflow-hidden rounded-3xl border border-gray-100 bg-gray-50">
          <img src={event.featured_image} alt={event.title} className="h-auto w-full object-cover" loading="lazy" />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-600">
        {event.time && (
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">{formatTime(event.time)}</span>
        )}
        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
          {event.location || 'Venue to be announced'}
        </span>
        {event.contact_email && (
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">{event.contact_email}</span>
        )}
      </div>

      <article className="prose prose-emerald mt-10 max-w-none prose-headings:text-gray-900 prose-p:text-gray-700">
        <p className="leading-relaxed">{event.description || 'More details for this event will be available soon.'}</p>
      </article>

      <div className="mt-16 flex flex-col gap-6 border-t border-gray-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Explore more upcoming activities</p>
          <p className="text-sm text-gray-500">Discover what is next for the MAMSA community.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/community/events"
            className="inline-flex items-center justify-center rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Back to Events
          </Link>
          <Link
            href="/community/updates"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Latest Updates
          </Link>
        </div>
      </div>
    </div>
  );
}
