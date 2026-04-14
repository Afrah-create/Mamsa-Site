import { UserRound } from 'lucide-react';

export default function StudentsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="aspect-square animate-pulse bg-gray-200" />
            <div className="p-3">
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-2 w-20 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
      <div className="py-20 text-center">
        <UserRound className="mx-auto h-16 w-16 text-gray-200" />
      </div>
    </div>
  );
}
