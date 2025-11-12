import { fetchPublishedGallery } from '@/lib/public-content';
import PublicGalleryBrowser from '@/components/PublicGalleryBrowser';

export const revalidate = 180;

export default async function GalleryPage() {
  const { data: images, error } = await fetchPublishedGallery();

  return (
    <div className="bg-white">
      <section className="bg-emerald-700 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="space-y-3 text-center md:mx-auto md:max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Gallery</p>
            <h1 className="text-balance text-4xl font-bold sm:text-5xl">Moments from the MAMSA Journey</h1>
            <p className="text-base text-emerald-50/90 sm:text-lg">
              Explore highlights from events, outreach, and the day-to-day life of our medical student community.
              Browse, search, and filter through memories captured by our members.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {error && (
          <div className="mb-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            We couldn&apos;t load the gallery at this time. Please refresh or try again later.
          </div>
        )}

        <PublicGalleryBrowser images={images} />
      </section>
    </div>
  );
}

