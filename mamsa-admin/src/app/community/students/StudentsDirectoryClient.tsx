'use client';

import { useMemo, useState } from 'react';
import SkilledStudentCard from '@/components/SkilledStudentCard';
import type { SkilledStudentPublic } from '@/lib/public-content';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

type TabId = 'all' | 'skill' | 'business';

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'skill', label: 'Skills' },
  { id: 'business', label: 'Businesses' },
];

type Props = {
  students: SkilledStudentPublic[];
  loadError: boolean;
};

export default function StudentsDirectoryClient({ students, loadError }: Props) {
  const [tab, setTab] = useState<TabId>('all');

  const filtered = useMemo(() => {
    if (tab === 'all') return students;
    return students.filter((s) => s.category === tab);
  }, [students, tab]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:px-10 lg:py-16">
      {loadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:shadow-black/20">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Directory unavailable</h2>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-200/90">
                We couldn&apos;t load listings right now. Please refresh in a moment or try again later.
              </p>
            </div>
          </div>
        </div>
      )}

      {!loadError && students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center dark:border-emerald-800/60 dark:bg-emerald-950/40">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-emerald-100">No listings yet</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-emerald-300/75">
            Student and business profiles will be shown here.
          </p>
        </div>
      ) : null}

      {!loadError && students.length > 0 ? (
        <>
          <div className="mb-8 flex flex-wrap justify-center gap-2 border-b border-gray-200 pb-4 dark:border-emerald-800/50 sm:justify-start">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === t.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-emerald-900/60 dark:text-emerald-200 dark:hover:bg-emerald-800/70'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-emerald-300/75">No listings in this category.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((student, index) => (
                <ScrollReveal key={student.id} delay={index * 80}>
                  <SkilledStudentCard student={student} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
