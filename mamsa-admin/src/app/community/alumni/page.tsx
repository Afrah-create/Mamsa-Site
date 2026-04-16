import Image from 'next/image';
import Link from 'next/link';
import AlumniDirectoryClient from '@/components/community/AlumniDirectoryClient';
import { fetchPublishedAlumni } from '@/lib/public-content';

export const revalidate = 300;

export default async function AlumniPage() {
  const { data: alumni, error } = await fetchPublishedAlumni();

  return (
    <>
      <header className="relative -mt-16 overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 pt-20 text-white sm:pt-24">
        <div className="absolute inset-0 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
          <Image
            src="/images/About.jpg"
            alt="MAMSA Alumni"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/85 via-emerald-600/80 to-emerald-500/85" />
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-12 text-center sm:gap-6 sm:px-8 sm:py-16 md:px-10 md:py-20 lg:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 sm:text-sm">Alumni</p>
          <h1 className="text-2xl font-bold drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">Notable MAMSA Alumni</h1>
          <p className="mx-auto max-w-2xl text-sm text-white/95 sm:text-base drop-shadow-md">
            Meet alumni from the MAMSA community.
          </p>
          <div className="flex justify-center pt-2">
            <Link
              href="/community/about"
              className="inline-flex items-center rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              About MAMSA
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10 lg:py-16">
        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:shadow-black/20">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Alumni profiles unavailable</h2>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-200/90">
                  We couldn&apos;t load alumni data right now. Please refresh in a moment or try again later.
                </p>
              </div>
            </div>
          </div>
        )}

        {!error && alumni.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center dark:border-emerald-800/60 dark:bg-emerald-950/40">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-emerald-100">No alumni yet</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-emerald-300/75">
              Alumni profiles will be shown here.
            </p>
          </div>
        ) : (
          <AlumniDirectoryClient alumni={alumni} />
        )}
      </div>
    </>
  );
}
