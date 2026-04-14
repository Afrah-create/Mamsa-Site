import Image from 'next/image';
import Link from 'next/link';
import StudentsDirectoryClient from './StudentsDirectoryClient';
import { getActiveSkilledStudents, type SkilledStudentPublic } from '@/lib/public-content';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export const revalidate = 300;

export default async function SkilledStudentsPage() {
  let students: SkilledStudentPublic[] = [];
  let loadError = false;
  try {
    students = await getActiveSkilledStudents();
  } catch {
    loadError = true;
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
        <ScrollReveal className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-12 text-center sm:gap-6 sm:px-8 sm:py-16 md:px-10 md:py-20 lg:px-12">
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
        </ScrollReveal>
      </header>

      <StudentsDirectoryClient students={students} loadError={loadError} />
    </>
  );
}
