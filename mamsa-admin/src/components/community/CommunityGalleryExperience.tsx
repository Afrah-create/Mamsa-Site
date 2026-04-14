'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import type { GalleryItem } from '@/types/gallery';

type Props = {
  items: GalleryItem[];
};

function formatMonthYear(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function masonryAspectClass(id: number): string {
  const patterns = ['aspect-[4/5]', 'aspect-[3/4]', 'aspect-square', 'aspect-[5/4]', 'aspect-video'];
  return patterns[Math.abs(id) % patterns.length] ?? 'aspect-square';
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
        <Camera className="h-14 w-14 text-gray-300" aria-hidden />
        <p className="text-lg font-medium text-gray-800">No photos yet. Check back soon.</p>
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
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mx-auto max-w-lg px-6 py-16 text-center text-gray-600">
          No photos in this category yet.
        </div>
      ) : (
        <div className="mx-auto max-w-7xl columns-1 gap-4 px-4 pb-16 sm:columns-2 sm:px-6 lg:columns-3 xl:columns-4">
          {filtered.map((item, idx) => {
            const src = item.image_url?.trim() ?? '';
            const alt = item.alt_text?.trim() || item.title;
            const featured = item.is_featured === 1;
            const aspect = masonryAspectClass(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openAt(item.id)}
                className={`group relative mb-4 w-full break-inside-avoid overflow-hidden rounded-xl bg-gray-100 text-left shadow-md transition duration-300 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  featured ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
                }`}
              >
                <div className={`relative w-full ${aspect}`}>
                  {src ? (
                    <Image
                      src={src}
                      alt={alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      loading={idx < 4 ? 'eager' : 'lazy'}
                      priority={idx < 4}
                      unoptimized={/^https?:\/\//i.test(src)}
                    />
                  ) : (
                    <div className="flex h-full min-h-[12rem] w-full items-center justify-center bg-gray-200 text-gray-400">
                      <Camera className="h-10 w-10" aria-hidden />
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {item.category?.trim() ? (
                    <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {item.category}
                    </span>
                  ) : null}
                  {item.photographer?.trim() ? (
                    <span className="pointer-events-none absolute bottom-2 left-2 max-w-[85%] truncate text-xs text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {item.photographer}
                    </span>
                  ) : null}
                </div>
              </button>
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
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
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
              {current.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.image_url}
                  alt={current.alt_text?.trim() || current.title}
                  className="mx-auto max-h-[85vh] max-w-full object-contain"
                />
              ) : null}
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
