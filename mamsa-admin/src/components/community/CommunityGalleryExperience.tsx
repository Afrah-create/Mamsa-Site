'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import type { GalleryItem } from '@/types/gallery';
import { AppImage } from '@/components/ui/AppImage';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

type Props = {
  items: GalleryItem[];
};

function formatMonthYear(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function CommunityGalleryExperience({ items }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    items.forEach((item) => {
      if (item.category?.trim()) unique.add(item.category.trim());
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return items;
    return items.filter((i) => (i.category ?? '').trim() === activeCategory);
  }, [items, activeCategory]);

  const openAt = useCallback((id: number) => {
    const idx = filtered.findIndex((i) => i.id === id);
    if (idx >= 0) setLightboxIndex(idx);
  }, [filtered]);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i == null || i <= 0 ? i : i - 1));
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((i) => {
      if (i == null) return i;
      if (i >= filtered.length - 1) return i;
      return i + 1;
    });
  }, [filtered.length]);

  useEffect(() => {
    if (lightboxIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, closeLightbox, goPrev, goNext]);

  const current = lightboxIndex != null ? filtered[lightboxIndex] : null;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-24 text-center">
        <Camera className="h-14 w-14 text-gray-300 dark:text-emerald-700/70" aria-hidden />
        <p className="text-lg font-medium text-gray-800 dark:text-emerald-100">No photos yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-emerald-900/60 dark:text-emerald-200 dark:hover:bg-emerald-800/70'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCategory === c
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-emerald-900/60 dark:text-emerald-200 dark:hover:bg-emerald-800/70'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mx-auto max-w-lg px-6 py-16 text-center text-gray-600 dark:text-emerald-300/80">
          No photos in this category yet.
        </div>
      ) : (
        <div className="mx-auto max-w-7xl columns-1 gap-4 px-4 pb-16 sm:columns-2 sm:px-6 lg:columns-3 xl:columns-4">
          {filtered.map((item, index) => {
            const src = item.image_url?.trim() ?? '';
            const alt = item.alt_text?.trim() || item.title;
            const featured = item.is_featured === 1;
            return (
              <ScrollReveal key={item.id} delay={index * 60} className="mb-4 break-inside-avoid">
                <button
                  type="button"
                  onClick={() => openAt(item.id)}
                  className={`group relative w-full cursor-pointer overflow-hidden rounded-xl bg-gray-100 text-left shadow-sm transition-shadow duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-900/45 dark:focus:ring-offset-emerald-950 ${
                    featured ? 'ring-2 ring-yellow-400 ring-offset-2 dark:ring-yellow-500/80 dark:ring-offset-emerald-950' : ''
                  }`}
                >
                  <div className="relative overflow-hidden rounded-xl">
                    <AppImage
                      src={src}
                      alt={alt}
                      className="block h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      fallback={
                        <div className="flex min-h-[12rem] w-full items-center justify-center bg-gray-200 text-gray-400 dark:bg-emerald-900/50 dark:text-emerald-600/80">
                          <Camera className="h-10 w-10" aria-hidden />
                        </div>
                      }
                    />
                    <div className="absolute inset-0 flex items-end bg-black/0 p-3 opacity-0 transition-all duration-300 group-hover:bg-black/30 group-hover:opacity-100">
                      <p className="line-clamp-2 text-xs font-medium text-white">{item.title}</p>
                    </div>
                  </div>
                </button>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {lightboxIndex != null && current ? (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-[3] rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Close gallery"
          >
            <X className="h-6 w-6" />
          </button>
          {filtered.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                disabled={lightboxIndex <= 0}
                className="absolute left-2 top-1/2 z-[1] -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30 sm:left-4"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                disabled={lightboxIndex >= filtered.length - 1}
                className="absolute right-2 top-1/2 z-[1] -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30 sm:right-4"
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          ) : null}
          <div
            className="mx-auto flex max-h-full w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={current.title}
          >
            <div className="relative max-h-[85vh] w-full max-w-[90vw] flex-1">
              <AppImage
                src={current.image_url}
                alt={current.alt_text?.trim() || current.title}
                objectFit="contain"
                className="mx-auto max-h-[85vh] max-w-full"
              />
            </div>
            <div className="max-w-2xl space-y-2 px-2 text-center text-white">
              <h2 className="text-xl font-semibold">{current.title}</h2>
              {current.description?.trim() ? (
                <p className="text-sm text-white/85">{current.description}</p>
              ) : null}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/75">
                {current.photographer?.trim() ? <span>Photo: {current.photographer}</span> : null}
                {current.location?.trim() ? <span>{current.location}</span> : null}
                {formatMonthYear(current.event_date) ? <span>{formatMonthYear(current.event_date)}</span> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
