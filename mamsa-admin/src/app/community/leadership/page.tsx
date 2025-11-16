import { fetchLeadership, type Leader } from '@/lib/public-content';
import OrgChart from '@/components/OrgChart';

export const revalidate = 300;

export default async function LeadershipPage() {
  const { data: leaders, error } = await fetchLeadership();

  return (
    <>
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 text-white -mt-16 pt-20 sm:pt-24">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
            <img
              src="/images/IMG-20250408-WA0154.jpg"
              alt="MAMSA Leadership"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/85 via-emerald-600/80 to-emerald-500/85" />
          </div>
          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-12 text-center sm:gap-6 sm:px-8 sm:py-16 md:px-10 md:py-20 lg:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 sm:text-sm">Leadership</p>
            <h1 className="text-2xl font-bold drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">Guiding the MAMSA Community</h1>
            <p className="mx-auto max-w-2xl text-sm text-white/95 sm:text-base drop-shadow-md">
              Meet the dedicated Madi students at Makerere and mentors who steward our programs, events, and community outreach.
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-2 sm:px-4 py-8 sm:py-12 lg:px-8">
      {error && (
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900">Unable to Load Leadership Directory</h3>
              <p className="mt-1 text-sm text-amber-800">
                We&apos;re having trouble loading the leadership profiles right now. This is usually temporary. Please try refreshing the page in a moment, or check back later.
              </p>
            </div>
          </div>
        </div>
      )}

      {leaders.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-lg font-semibold text-gray-700">Leadership directory coming soon</p>
          <p className="mt-2 text-sm text-gray-500">
            Profiles published in the admin panel will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="mt-12">
          {/* Hierarchical Organizational Chart */}
          <OrgChart leaders={leaders} />
        </div>
      )}
        </div>
    </>
  );
}

