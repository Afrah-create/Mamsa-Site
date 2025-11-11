import { fetchPublishedGallery } from '@/lib/public-content';

export const revalidate = 180;

export default async function GalleryPage() {
  const { data: images, error } = await fetchPublishedGallery();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-700 px-8 py-12 shadow-xl sm:px-12">
        <div className="space-y-4 text-center text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Gallery</p>
          <h1 className="text-4xl font-bold text-white">Moments from the MAMSA Journey</h1>
          <p className="text-base text-emerald-100">
            Browse highlights from events, outreach, and day-to-day student life captured by our community.
          </p>
        </div>

        {error && (
          <div className="mt-8 rounded-md border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700">
            We couldn&apos;t load the gallery at this time. Please refresh or try again later.
          </div>
        )}

        {images.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-white/40 bg-white/10 p-10 text-center text-white">
            <p className="text-lg font-semibold">Gallery will be available soon</p>
            <p className="mt-2 text-sm text-emerald-100">
              Publish gallery items in the admin panel to showcase memories here.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {images.map((item) => (
              <figure
                key={item.id}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-lg transition hover:-translate-y-1 hover:shadow-emerald-900/30"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-60 w-full object-cover opacity-90 transition group-hover:scale-105 group-hover:opacity-100"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-60 w-full items-center justify-center bg-emerald-600/50 text-emerald-100">
                    <span className="text-sm font-medium uppercase tracking-wide">Image pending</span>
                  </div>
                )}
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                    <p className="text-xs text-emerald-100">{item.category || 'MAMSA Community'}</p>
                    {item.description && (
                      <p className="text-xs text-emerald-100/90 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

