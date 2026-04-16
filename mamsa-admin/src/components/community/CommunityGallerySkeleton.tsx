export default function CommunityGallerySkeleton() {
  return (
    <div className="mx-auto max-w-7xl columns-1 gap-4 px-4 py-8 sm:columns-2 sm:px-6 lg:columns-3 xl:columns-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={`mb-4 break-inside-avoid rounded-xl animate-pulse bg-gray-200 dark:bg-emerald-900/50 ${
            ['h-56', 'h-72', 'h-64', 'h-80'][i % 4]
          }`}
        />
      ))}
    </div>
  );
}
