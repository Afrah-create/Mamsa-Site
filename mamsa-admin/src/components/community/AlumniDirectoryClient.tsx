'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Globe, Linkedin, UserRound, X } from 'lucide-react';
import { CardImage } from '@/components/ui/CardImage';
import type { NotableAlumnus } from '@/lib/public-content';

type Props = {
  alumni: NotableAlumnus[];
};

export default function AlumniDirectoryClient({ alumni }: Props) {
  const [activeId, setActiveId] = useState<number | null>(null);

  const activeAlumnus = useMemo(
    () => (activeId == null ? null : alumni.find((item) => item.id === activeId) ?? null),
    [activeId, alumni],
  );

  useEffect(() => {
    if (!activeAlumnus) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeAlumnus]);

  const profileLinks = activeAlumnus?.profile_links;
  const socialItems = [
    profileLinks?.linkedin
      ? { key: 'linkedin', label: 'LinkedIn', href: profileLinks.linkedin, icon: Linkedin }
      : null,
    profileLinks?.twitter
      ? { key: 'twitter', label: 'X / Twitter', href: profileLinks.twitter, icon: ExternalLink }
      : null,
    profileLinks?.website
      ? { key: 'website', label: 'Website', href: profileLinks.website, icon: Globe }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; href: string; icon: React.ComponentType<{ className?: string }> }>;

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {alumni.map((alumnus) => {
          const profession =
            [alumnus.current_position, alumnus.organization].filter(Boolean).join(' • ') ||
            alumnus.specialty ||
            'Community leader';
          return (
            <button
              key={alumnus.id}
              type="button"
              onClick={() => setActiveId(alumnus.id)}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm transition-shadow duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <CardImage
                src={alumnus.image_url}
                alt={alumnus.full_name || 'Alumni'}
                aspect="square"
                position="top"
                overlay={false}
                rounded="top"
                placeholderIcon={<UserRound className="h-8 w-8 text-gray-300" />}
                placeholderLabel="No photo"
              />
              <div className="p-3">
                <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">{alumnus.full_name}</h3>
                <p className="mt-1 text-xs font-medium text-emerald-600">
                  {alumnus.graduation_year != null ? `Class of ${alumnus.graduation_year}` : 'MAMSA Alumni'}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-gray-500">{profession}</p>
              </div>
            </button>
          );
        })}
      </div>

      {activeAlumnus ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onClick={() => setActiveId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={activeAlumnus.full_name}
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveId(null)}
              aria-label="Close alumni details"
              className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/75"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid gap-6 p-5 sm:grid-cols-[220px,1fr] sm:p-6">
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <CardImage
                  src={activeAlumnus.image_url}
                  alt={activeAlumnus.full_name}
                  aspect="portrait"
                  position="top"
                  rounded="all"
                  placeholderIcon={<UserRound className="h-10 w-10 text-gray-300" />}
                  placeholderLabel="No photo"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{activeAlumnus.full_name}</h3>
                  <p className="mt-1 text-sm text-emerald-700">
                    {activeAlumnus.current_position || activeAlumnus.specialty || 'MAMSA Alumni'}
                    {activeAlumnus.organization ? ` • ${activeAlumnus.organization}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {activeAlumnus.graduation_year ? `Class of ${activeAlumnus.graduation_year}` : 'Graduation year not specified'}
                  </p>
                </div>

                <div className="space-y-3 text-sm text-gray-700">
                  {activeAlumnus.biography ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Biography</p>
                      <p className="mt-1 leading-relaxed">{activeAlumnus.biography}</p>
                    </div>
                  ) : null}

                  {activeAlumnus.achievements ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Achievements</p>
                      <p className="mt-1 leading-relaxed">{activeAlumnus.achievements}</p>
                    </div>
                  ) : null}
                </div>

                {socialItems.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Social Links</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {socialItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <a
                            key={item.key}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {item.label}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

