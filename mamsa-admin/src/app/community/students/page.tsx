import Image from 'next/image';
import Link from 'next/link';
import SkilledStudentCard from '@/components/SkilledStudentCard';
import { getActiveSkilledStudents, type SkilledStudentPublic } from '@/lib/public-content';

export const revalidate = 300;

export default async function SkilledStudentsPage() {
  let students: SkilledStudentPublic[] = [];
  let error = false;
  try {
    students = await getActiveSkilledStudents();
  } catch {
    error = true;
  }

  return (
    <>
      <header className="relative -mt-16 overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 pt-20 text-white sm:pt-24">
        <div className="absolute inset-0 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
          <Image
            src="/images/About.jpg"
            alt="MAMSA skilled students and entrepreneurs"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/85 via-emerald-600/80 to-emerald-500/85" />
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-12 text-center sm:gap-6 sm:px-8 sm:py-16 md:px-10 md:py-20 lg:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 sm:text-sm">Community</p>
          <h1 className="text-2xl font-bold drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">Skilled students &amp; business</h1>
          <p className="mx-auto max-w-2xl text-sm text-white/95 sm:text-base drop-shadow-md">
            Members offering skills or small businesses, with an active listing on MAMSA. Connect for services,
            collaborations, and community support.
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
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 flex-shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h2 className="text-sm font-semibold text-amber-900">Directory unavailable</h2>
                <p className="mt-1 text-sm text-amber-800">
                  We couldn&apos;t load listings right now. Please refresh in a moment or try again later.
                </p>
              </div>
            </div>
          </div>
        )}

        {!error && students.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-800">Listings coming soon</h2>
            <p className="mt-2 text-sm text-gray-500">
              Active skilled students and business profiles from the admin site will appear here automatically.
            </p>
          </div>
        ) : null}

        {!error && students.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {students.map((student) => (
              <SkilledStudentCard key={student.id} student={student} />
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
