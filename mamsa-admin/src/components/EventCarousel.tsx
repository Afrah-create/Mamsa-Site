'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { Event } from '@/lib/public-content';
import { formatDate, formatTime } from '@/lib/public-content-utils';

type Props = {
  events: Event[];
};

const SLIDE_DELAY = 8000;

export default function EventCarousel({ events }: Props) {
  const slides = useMemo(() => events.filter((event) => Boolean(event.title)), [events]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      if (!isPaused) {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }
    }, SLIDE_DELAY);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  if (slides.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
        <p className="text-lg font-semibold text-gray-700">No upcoming events right now.</p>
        <p className="mt-2 text-sm text-gray-500">Check back soon for new opportunities to engage with the community.</p>
      </div>
    );
  }

  const goToSlide = (index: number) => {
    setCurrentIndex((index + slides.length) % slides.length);
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((event) => (
          <article key={event.id} className="flex w-full flex-none flex-col md:flex-row">
            <div className="relative h-72 w-full overflow-hidden md:h-[420px] md:w-1/2">
              {event.featured_image ? (
                <Image
                  src={event.featured_image}
                  alt={event.title}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-emerald-500">
                  <span className="text-sm font-semibold uppercase tracking-wide">MAMSA Event</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/10" />
            </div>

            <div className="flex w-full flex-col justify-between gap-6 p-8 md:w-1/2 md:p-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  <span>{event.status || 'Upcoming'}</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-semibold text-gray-900">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-gray-600 sm:text-base">{event.description}</p>
                  )}
                </div>
              </div>
              <dl className="grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Date</dt>
                    <dd className="font-medium text-gray-900">{formatDate(event.date)}</dd>
                  </div>
                </div>
                {(event.time || event.location) && (
                  <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a8 8 0 018 8c0 5-8 12-8 12s-8-7-8-12a8 8 0 018-8z" />
                        <circle cx={12} cy={10} r={3} />
                      </svg>
                    </span>
                    <div>
                      {event.location && (
                        <>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Location</dt>
                          <dd className="font-medium text-gray-900">{event.location}</dd>
                        </>
                      )}
                      {event.time && (
                        <>
                          <dt className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Time</dt>
                          <dd className="font-medium text-gray-900">{formatTime(event.time)}</dd>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </dl>
            </div>
          </article>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {slides.map((event, index) => (
              <button
                key={event.id}
                type="button"
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentIndex === index ? 'w-8 bg-emerald-500' : 'w-2.5 bg-emerald-200 hover:bg-emerald-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
            <div className="h-32 w-24 bg-gradient-to-r from-white to-transparent" />
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
            <div className="h-32 w-24 bg-gradient-to-l from-white to-transparent" />
          </div>
        </>
      )}
    </div>
  );
}

