'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const navigation = [
  { label: 'Home', href: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h3' },
  { label: 'About', href: '/community/about', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Updates', href: '/community/updates', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
  { label: 'Events', href: '/community/events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Leadership', href: '/community/leadership', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { label: 'Gallery', href: '/community/gallery', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Contact', href: '/contact', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
];

export default function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before showing mobile menu to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMobile = () => setMobileOpen((open) => !open);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-emerald-100 bg-white/95 backdrop-blur" suppressHydrationWarning>
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
          aria-expanded={mobileOpen}
          onClick={toggleMobile}
          className="relative inline-flex items-center justify-center rounded-lg border border-emerald-200 p-2.5 text-emerald-700 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 active:scale-95 md:hidden"
        >
          <svg
            className="h-5 w-5 transition-transform duration-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {mobileOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu backdrop */}
      {mounted && mobileOpen && (
        <div
          className="fixed inset-0 top-16 z-30 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
          suppressHydrationWarning
        />
      )}

      {/* Mobile menu */}
      {mounted && mobileOpen && (
        <nav
          className="fixed inset-x-0 top-16 z-40 border-t border-emerald-100 bg-white/98 backdrop-blur-md shadow-lg md:hidden"
          suppressHydrationWarning
        >
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex flex-col gap-1">
              {navigation.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className="group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100"
                  style={{
                    animation: `slideDown 0.3s ease-out ${index * 0.05}s both`,
                  }}
                >
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-emerald-600 transition-colors group-hover:text-emerald-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  <span className="flex-1">{item.label}</span>
                  <svg
                    className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </nav>
      )}

    </header>
  );
}

