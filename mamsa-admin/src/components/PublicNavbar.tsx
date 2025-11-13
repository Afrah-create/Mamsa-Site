'use client';

import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';

const navigation = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/community/about' },
  { label: 'Updates', href: '/community/updates' },
  { label: 'Events', href: '/community/events' },
  { label: 'Leadership', href: '/community/leadership' },
  { label: 'Gallery', href: '/community/gallery' },
  { label: 'Contact', href: '/contact' },
];

export default function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen((open) => !open);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 text-lg font-semibold text-emerald-700 transition hover:text-emerald-800"
          onClick={closeMobile}
        >
          <span className="relative h-10 w-10 overflow-hidden rounded-full border border-emerald-100 shadow-sm">
            <Image
              src="/images/mamsa-logo.JPG"
              alt="MAMSA logo"
              fill
              sizes="40px"
              className="object-cover"
              priority
            />
          </span>
          <span className="tracking-wide">MAMSA</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1 transition hover:text-emerald-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={toggleMobile}
          className="inline-flex items-center justify-center rounded-md border border-emerald-200 p-2 text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 md:hidden"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <nav className="border-t border-emerald-100 bg-white py-4 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

