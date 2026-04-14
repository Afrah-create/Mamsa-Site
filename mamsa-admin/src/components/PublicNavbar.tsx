'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  CircleDot,
  Eye,
  GraduationCap,
  Home,
  Images,
  Info,
  Mail,
  Menu,
  Newspaper,
  ShieldCheck,
  Target,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

const PRIMARY_NAV = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'About', href: '/community/about', icon: Info },
  { label: 'News', href: '/community/updates', icon: Newspaper },
  { label: 'Events', href: '/community/events', icon: CalendarDays },
  { label: 'Contact', href: '/contact', icon: Mail },
] as const;

const COMMUNITY_ITEMS = [
  {
    label: 'Alumni',
    href: '/community/alumni',
    icon: GraduationCap,
    description: 'Notable graduates and profiles',
  },
  {
    label: 'Skilled Students',
    href: '/community/students',
    icon: BookOpen,
    description: 'Student achievements directory',
  },
  {
    label: 'Gallery',
    href: '/community/gallery',
    icon: Images,
    description: 'Photos from MAMSA life',
  },
] as const;

const ALUMNI_HREF = '/community/alumni';
const TICKER_ITEMS = [
  {
    key: 'name',
    label: 'Association',
    text: 'Madi Makerere University Students Association (MAMSA)',
    icon: CircleDot,
  },
  {
    key: 'mission',
    label: 'Mission',
    text: 'Unite Ma’di students, promote academic excellence, preserve culture, and support socio-economic development.',
    icon: Target,
  },
  {
    key: 'vision',
    label: 'Vision',
    text: 'A strong, connected, and impactful Ma’di student community at Makerere and beyond.',
    icon: Eye,
  },
  {
    key: 'objectives',
    label: 'Objectives',
    text: 'Promote education, defend member interests, encourage youth participation, and advance community development.',
    icon: ShieldCheck,
  },
] as const;

function pathMatches(href: string, pathname: string | null) {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PublicNavbar() {
  const pathname = usePathname();
  const menuId = useId();
  const communityMenuId = useId();
  const communityWrapRef = useRef<HTMLDivElement>(null);
  const communityTriggerRef = useRef<HTMLButtonElement>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [communityAccordionOpen, setCommunityAccordionOpen] = useState(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const openCommunity = useCallback(() => {
    clearLeaveTimer();
    setCommunityOpen(true);
  }, [clearLeaveTimer]);

  const scheduleCloseCommunity = useCallback(() => {
    clearLeaveTimer();
    leaveTimerRef.current = setTimeout(() => setCommunityOpen(false), 160);
  }, [clearLeaveTimer]);

  const closeCommunity = useCallback(() => {
    clearLeaveTimer();
    setCommunityOpen(false);
  }, [clearLeaveTimer]);

  const toggleCommunity = useCallback(() => {
    setCommunityOpen((o) => !o);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((o) => !o), []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCommunity();
        setMobileOpen(false);
        communityTriggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeCommunity]);

  useEffect(() => {
    if (!communityOpen) return;
    const onPointerDown = (e: Event) => {
      const el = communityWrapRef.current;
      const target = e.target;
      if (el && target instanceof Node && !el.contains(target)) closeCommunity();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [communityOpen, closeCommunity]);

  useEffect(() => {
    return () => clearLeaveTimer();
  }, [clearLeaveTimer]);

  const communityChildActive = COMMUNITY_ITEMS.some((item) => pathMatches(item.href, pathname));
  const desktopNavLinkClass = (href: string, extra?: string) => {
    const active = pathMatches(href, pathname);
    return [
      'relative rounded-md px-2 py-2 text-sm font-medium tracking-wide text-gray-600 transition-colors duration-150 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:text-emerald-100/85 dark:hover:text-white',
      active
        ? 'font-semibold text-emerald-700 after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-emerald-600 dark:text-white'
        : '',
      extra ?? '',
    ]
      .filter(Boolean)
      .join(' ');
  };

  return (
    <>
    <div className="fixed inset-x-0 top-0 z-[60] h-8 overflow-hidden border-b border-emerald-700/60 bg-emerald-900 text-emerald-50">
      <div className="ticker-track flex min-w-max items-center whitespace-nowrap">
        {[0, 1].map((loop) => (
          <div key={loop} className="flex items-center gap-6 px-6" aria-hidden={loop === 1}>
            {TICKER_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={`${loop}-${item.key}`} className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-800/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-100">
                    <Icon className="h-3 w-3" aria-hidden />
                    {item.label}
                  </span>
                  <span className="text-[11px] font-medium tracking-wide text-emerald-50/95">{item.text}</span>
                  {index < TICKER_ITEMS.length - 1 ? <span className="ml-1 text-emerald-300/80">•</span> : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
    <header
      className="fixed inset-x-0 top-8 z-50 bg-white/90 shadow-sm shadow-emerald-900/5 backdrop-blur-md dark:bg-emerald-950/90 dark:shadow-black/20"
      suppressHydrationWarning
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
        <Link
          href="/"
          className="flex min-w-0 flex-shrink-0 items-center gap-3 text-lg font-semibold text-emerald-700 transition-colors duration-150 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:text-emerald-200 dark:hover:text-white"
          aria-label="MAMSA home"
          onClick={closeMobile}
        >
          <span className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-emerald-100 shadow-sm dark:border-emerald-800">
            {!logoError ? (
              <img
                src="/images/mamsa-logo.JPG"
                alt="MAMSA logo"
                className="h-10 w-10 rounded-full object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-700">
                <span className="text-xs font-bold text-white">M</span>
              </div>
            )}
          </span>
          <span className="truncate tracking-wide">MAMSA</span>
        </Link>

        {/* Desktop center + right */}
        <div className="hidden flex-1 items-center justify-center gap-2 lg:flex">
          <nav className="flex flex-wrap items-center justify-center gap-1 xl:gap-2" aria-label="Primary">
            {PRIMARY_NAV.map((item) => (
              <Link key={item.href} href={item.href} className={desktopNavLinkClass(item.href)}>
                {item.label}
              </Link>
            ))}

            <div
              ref={communityWrapRef}
              className="relative"
              onMouseEnter={openCommunity}
              onMouseLeave={scheduleCloseCommunity}
            >
              <button
                ref={communityTriggerRef}
                type="button"
                className={[
                  'relative inline-flex items-center gap-1 rounded-md px-2 py-2 text-sm font-medium tracking-wide transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
                  communityOpen || communityChildActive
                    ? 'font-semibold text-emerald-700 dark:text-white'
                    : 'text-gray-600 hover:text-emerald-700 dark:text-emerald-100/85 dark:hover:text-white',
                  communityChildActive && !communityOpen
                    ? 'after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-emerald-600'
                    : '',
                ].join(' ')}
                aria-label="Community menu"
                aria-expanded={communityOpen}
                aria-haspopup="menu"
                aria-controls={communityMenuId}
                id={`${communityMenuId}-trigger`}
                onClick={toggleCommunity}
                onFocus={openCommunity}
              >
                Community
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${communityOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>

              <div
                id={communityMenuId}
                role="menu"
                aria-hidden={!communityOpen}
                aria-labelledby={`${communityMenuId}-trigger`}
                className={[
                  'absolute left-1/2 top-full z-50 mt-2 min-w-[220px] -translate-x-1/2 rounded-xl border border-emerald-100/80 bg-white p-2 shadow-lg ring-1 ring-black/5 transition-all duration-200 ease-out dark:border-emerald-800 dark:bg-emerald-900 dark:ring-white/10',
                  communityOpen
                    ? 'pointer-events-auto translate-y-0 opacity-100'
                    : 'pointer-events-none -translate-y-1 opacity-0',
                ].join(' ')}
                onMouseEnter={openCommunity}
                onMouseLeave={scheduleCloseCommunity}
              >
                {COMMUNITY_ITEMS.map((item) => {
                  const active = pathMatches(item.href, pathname);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className={[
                        'flex flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset',
                        active
                          ? 'border-l-4 border-emerald-600 bg-emerald-50/90 pl-[calc(0.75rem-4px)] dark:border-emerald-400 dark:bg-emerald-800/60'
                          : 'border-l-4 border-transparent hover:bg-emerald-50/70 dark:hover:bg-emerald-800/40',
                      ].join(' ')}
                      onClick={closeCommunity}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-emerald-50">
                        <Icon className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden />
                        {item.label}
                      </span>
                      <span className="pl-6 text-xs leading-snug text-gray-500 dark:text-emerald-200/75">
                        {item.description}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href={ALUMNI_HREF}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:bg-emerald-500 dark:hover:bg-emerald-400"
            aria-label="View notable alumni"
          >
            <GraduationCap className="h-4 w-4" aria-hidden />
            Notable Alumni
          </Link>
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          aria-controls={menuId}
          onClick={toggleMobile}
          className="inline-flex items-center justify-center rounded-lg p-2.5 text-emerald-700 transition-colors duration-150 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:text-emerald-200 dark:hover:bg-emerald-900 lg:hidden"
        >
          {mobileOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
        </button>
      </div>

      {/* Mobile menu + overlay */}
      <>
        <button
          type="button"
          aria-label="Close navigation overlay"
          className={[
            'fixed inset-0 z-40 bg-emerald-950/35 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden',
            mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
          ].join(' ')}
          onClick={closeMobile}
        />

        <div
          id={menuId}
          className={[
            'fixed left-4 right-4 top-[6rem] z-50 flex max-h-[calc(100vh-6.75rem)] flex-col overflow-hidden rounded-2xl border border-emerald-100/80 bg-white/95 shadow-2xl shadow-emerald-900/15 backdrop-blur dark:border-emerald-800 dark:bg-emerald-950/95 lg:hidden',
            'origin-top-right transition-all duration-300 ease-out',
            mobileOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none -translate-y-2 scale-[0.985] opacity-0',
          ].join(' ')}
          aria-hidden={!mobileOpen}
        >
            <div className="flex items-center justify-between border-b border-emerald-100/90 bg-emerald-50/70 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/35">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Navigation</p>
                <p className="text-sm font-semibold tracking-wide text-emerald-900 dark:text-emerald-100">MAMSA Menu</p>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={closeMobile}
                className="rounded-lg p-2 text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-200 dark:hover:bg-emerald-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4 scrollbar-hide" aria-label="Mobile primary">
              <div className="rounded-xl border border-emerald-100/80 bg-white p-1 dark:border-emerald-800 dark:bg-emerald-950/40">
                {PRIMARY_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = pathMatches(item.href, pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      className={[
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium tracking-wide transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset',
                        active
                          ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/60 dark:text-white'
                          : 'text-gray-700 hover:bg-emerald-50/80 dark:text-emerald-100/90 dark:hover:bg-emerald-900/50',
                      ].join(' ')}
                    >
                      <Icon className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="rounded-xl border border-emerald-100/80 bg-white p-1 dark:border-emerald-800 dark:bg-emerald-950/40">
                <button
                  type="button"
                  aria-expanded={communityAccordionOpen}
                  aria-controls={`${menuId}-community-panel`}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium tracking-wide text-gray-800 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset dark:text-emerald-50 dark:hover:bg-emerald-900/50"
                  onClick={() => setCommunityAccordionOpen((o) => !o)}
                >
                  <span className="flex items-center gap-3">
                    <Users className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden />
                    Community
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-emerald-600 transition-transform dark:text-emerald-300 ${communityAccordionOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                <div
                  id={`${menuId}-community-panel`}
                  className={communityAccordionOpen ? 'mt-1 flex flex-col gap-1 px-1 pb-1' : 'hidden'}
                  role="group"
                  aria-label="Community links"
                >
                  {COMMUNITY_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = pathMatches(item.href, pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobile}
                        className={[
                          'flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset',
                          active
                            ? 'bg-emerald-50 font-semibold text-emerald-900 shadow-sm dark:bg-emerald-900/60 dark:text-white'
                            : 'text-gray-700 hover:bg-emerald-50/80 dark:text-emerald-100/85 dark:hover:bg-emerald-900/40',
                        ].join(' ')}
                      >
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden />
                        <span>
                          <span className="block font-medium">{item.label}</span>
                          <span className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-emerald-200/70">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </nav>

            <div className="border-t border-emerald-100 bg-white/90 p-4 dark:border-emerald-800 dark:bg-emerald-950/80">
              <Link
                href={ALUMNI_HREF}
                onClick={closeMobile}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                aria-label="View notable alumni"
              >
                <GraduationCap className="h-4 w-4" aria-hidden />
                Notable Alumni
              </Link>
            </div>
        </div>
      </>
    </header>
    </>
  );
}
