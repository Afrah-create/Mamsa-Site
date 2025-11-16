'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before starting carousel to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || slides.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      if (!isPaused) {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }
    }, SLIDE_DELAY);

    return () => clearInterval(timer);
  }, [mounted, slides.length, isPaused]);

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
      className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white/60 shadow-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((event) => {
          const hasDetails = Boolean(event.location || event.time || event.organizer);

          return (
            <Link key={event.id} href="/community/events" className="w-full flex-none block">
              <article className="w-full h-full">
                <div className="relative h-[320px] w-full overflow-hidden sm:h-[360px] lg:h-[420px] cursor-pointer">
                {event.featured_image ? (
                  <Image
                    src={event.featured_image}
                    alt={event.title}
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white">
                    <span className="text-sm font-semibold uppercase tracking-wide">MAMSA Event</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10" />
                <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-white/80">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      {event.status || 'Upcoming'}
                    </span>
                    <span>{formatDate(event.date)}</span>
                  </div>

                  <div className="space-y-4 text-white drop-shadow">
                    <h3 className="text-balance text-2xl font-semibold sm:text-3xl lg:text-[2.1rem]">{event.title}</h3>
                    {event.description && (
                      <p className="max-w-3xl text-sm leading-relaxed text-white/90 sm:text-base">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {hasDetails && (
                    <div className="flex flex-wrap gap-3 text-xs text-white/85 sm:text-sm">
                      {event.location && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 14s5-3.33 5-7A5 5 0 003 7c0 3.67 5 7 5 7z"
                            />
                            <circle cx={8} cy={7} r={1.5} />
                          </svg>
                          {event.location}
                        </span>
                      )}
                      {event.time && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <circle cx={8} cy={8} r={5.25} />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5.25V8l2.25 1.5" />
                          </svg>
                          {formatTime(event.time)}
                        </span>
                      )}
                      {event.organizer && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 8a3 3 0 100-6 3 3 0 000 6zM2.5 13.25a5.5 5.5 0 0111 0"
                            />
                          </svg>
                          {event.organizer}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              </article>
            </Link>
          );
        })}
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
                  currentIndex === index ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

