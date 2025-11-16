import Link from 'next/link';
import { fetchPublishedGallery } from '@/lib/public-content';
import PublicGalleryBrowser from '@/components/PublicGalleryBrowser';

export const revalidate = 180;

export default async function GalleryPage() {
  const { data: images, error } = await fetchPublishedGallery();

  return (
    <div className="bg-white">
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 text-white -mt-16 pt-20 sm:pt-24">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
          <img
            src="/images/IMG-20250408-WA0163.jpg"
            alt="MAMSA Gallery"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/85 via-emerald-600/80 to-emerald-500/85" />
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-12 text-center sm:gap-6 sm:px-8 sm:py-16 md:px-10 md:py-20 lg:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 sm:text-sm">Gallery</p>
          <h1 className="text-2xl font-bold drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">Moments from the MAMSA Journey</h1>
          <p className="mx-auto max-w-2xl text-sm text-white/95 sm:text-base drop-shadow-md">
            Explore highlights from events, outreach, and the day-to-day life of our medical student community.
            Browse, search, and filter through memories captured by our members.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-2 text-white/90 sm:flex-row sm:gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-white/95 px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-lg shadow-emerald-900/30 transition hover:-translate-y-0.5 hover:bg-white"
            >
              Upload an Image
            </Link>
            <span className="text-xs text-white/90 sm:text-sm">
              Administrators can upload new gallery items after signing in.
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {error && (
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900">Gallery Temporarily Unavailable</h3>
                <p className="mt-1 text-sm text-amber-800">
                  We&apos;re experiencing a temporary issue loading the photo gallery. This should be resolved soon. Please try refreshing the page, or come back in a few minutes to browse our collection of MAMSA moments.
                </p>
              </div>
            </div>
          </div>
        )}

        <PublicGalleryBrowser images={images} />
      </section>
    </div>
  );
}

