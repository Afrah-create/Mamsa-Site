'use client';

import { useMemo, useState } from 'react';
import SkilledStudentCard from '@/components/SkilledStudentCard';
import type { SkilledStudentPublic } from '@/lib/public-content';

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

      {!loadError && students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-gray-800">No listings yet</h2>
          <p className="mt-2 text-sm text-gray-500">
            Student and business profiles will be shown here.
          </p>
        </div>
      ) : null}

      {!loadError && students.length > 0 ? (
        <>
          <div className="mb-8 flex flex-wrap justify-center gap-2 border-b border-gray-200 pb-4 sm:justify-start">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === t.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-500">No listings in this category.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((student) => (
                <SkilledStudentCard key={student.id} student={student} />
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
