'use client';

import { useMemo, useState } from 'react';
import type { GalleryImage } from '@/lib/public-content';

type Props = {
  images: GalleryImage[];
};

const normalize = (value: string) => value.toLowerCase().trim();

export default function PublicGalleryBrowser({ images }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = useMemo(() => {
    const unique = new Set<string>();
    images.forEach((item) => {
      if (item.category) {
        unique.add(item.category);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [images]);

  const filteredImages = useMemo(() => {
    const query = normalize(searchTerm);

    return images.filter((item) => {
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

      if (!query) {
        return matchesCategory;
      }

      const haystack = [
        item.title,
        item.description ?? '',
        item.category ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return matchesCategory && haystack.includes(query);
    });
  }, [images, searchTerm, categoryFilter]);

  const nothingToShow = images.length === 0;
  const nothingMatches = !nothingToShow && filteredImages.length === 0;

  return (
    <div className="space-y-10">
      <div className="grid gap-4 md:grid-cols-[2fr,1fr] md:items-center">
        <label className="flex w-full flex-col">
          <span className="text-sm font-medium text-gray-700">Search gallery</span>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.1-4.4a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
              </svg>
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by title, theme, or description..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200/60"
            />
          </div>
        </label>
        <label className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">Filter by category</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="mt-2 rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200/60"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      {nothingToShow ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Gallery will be available soon</h2>
          <p className="mt-2 text-sm text-gray-500">
            Publish gallery items in the admin portal to showcase memories here.
          </p>
        </div>
      ) : nothingMatches ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">No images match your search</h2>
          <p className="mt-2 text-sm text-gray-500">Try a different keyword or choose another category.</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredImages.map((item) => (
            <figure
              key={item.id}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
                    <span className="text-sm font-medium uppercase tracking-wide">Image pending</span>
                  </div>
                )}
              </div>
              <figcaption className="flex flex-1 flex-col gap-3 px-5 py-6 text-left">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    {item.category || 'MAMSA Community'}
                  </p>
                  <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {item.description}
                  </p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

