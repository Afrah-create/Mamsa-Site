import { Suspense } from 'react';
import { fetchPublishedGallery } from '@/lib/public-content';
import CommunityGalleryExperience from '@/components/community/CommunityGalleryExperience';
import CommunityGallerySkeleton from '@/components/community/CommunityGallerySkeleton';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export const revalidate = 300;

async function GalleryData() {
  const { data: items, error } = await fetchPublishedGallery();

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm">
          Gallery is temporarily unavailable. Please try again later.
        </div>
      </div>
    );
  }

  return <CommunityGalleryExperience items={items} />;
}

export default function CommunityGalleryPage() {
  return (
    <div className="bg-white">
      <header className="border-b border-emerald-100/60 bg-gradient-to-br from-emerald-50 via-white to-gray-50 px-4 py-10 sm:px-8 sm:py-14">
        <ScrollReveal className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Community</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Our Gallery</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
            Photos from events and community activities.
          </p>
        </ScrollReveal>
      </header>

      <Suspense fallback={<CommunityGallerySkeleton />}>
        <GalleryData />
      </Suspense>
    </div>
  );
}
