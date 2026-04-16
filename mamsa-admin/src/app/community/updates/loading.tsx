import { Newspaper } from 'lucide-react';

export default function UpdatesLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-emerald-800/50 dark:bg-emerald-950/60 dark:shadow-black/20"
          >
            <div className="aspect-video animate-pulse bg-gray-200 dark:bg-emerald-900/50" />
            <div className="p-4">
              <div className="h-3 w-28 animate-pulse rounded bg-gray-200 dark:bg-emerald-800/50" />
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-gray-100 dark:bg-emerald-900/40" />
            </div>
          </div>
        ))}
      </div>
      <div className="py-20 text-center">
        <Newspaper className="mx-auto h-16 w-16 text-gray-200 dark:text-emerald-800/50" />
      </div>
    </div>
  );
}
