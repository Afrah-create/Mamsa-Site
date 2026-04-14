"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

const footerExploreLinks = [
  { label: 'Updates', href: '/community/updates' },
  { label: 'Events', href: '/community/events' },
  { label: 'Leadership', href: '/community/leadership' },
  { label: 'Contact', href: '/contact' },
];

const footerCommunityLinks = [
  { label: 'Alumni', href: '/community/alumni' },
  { label: 'Skilled students', href: '/community/students' },
  { label: 'Gallery', href: '/community/gallery' },
];

export default function PublicFooter() {
  const [copyrightYear, setCopyrightYear] = useState<number | null>(null);

  useEffect(() => {
    setCopyrightYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-emerald-950 text-emerald-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="relative h-12 w-12 overflow-hidden rounded-full border border-emerald-800 bg-emerald-900/60 shadow-lg shadow-emerald-900/40">
            <img
              src="/images/mamsa-logo.JPG"
              alt="MAMSA logo"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-wide text-emerald-100">MAMSA</p>
            <p className="mt-1 text-sm text-emerald-200/80">Olu Alu Vu Ozoni</p>
          </div>
        </div>
        <div className="flex flex-col gap-5 text-sm font-medium text-emerald-100/80 md:items-end">
          <nav className="flex flex-wrap items-center gap-4" aria-label="Site sections">
            {footerExploreLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-300/90">Community</p>
            <nav className="flex flex-wrap items-center gap-4" aria-label="Community">
              {footerCommunityLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="bg-emerald-900/40 py-4 text-center text-xs text-emerald-200/80">
        © {copyrightYear ?? ''} MAMSA. All rights reserved.
      </div>
    </footer>
  );
}

