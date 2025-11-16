'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Start progress immediately when route changes
    setProgress(10);

    // Simulate progress
    const timer1 = setTimeout(() => setProgress(30), 100);
    const timer2 = setTimeout(() => setProgress(60), 300);
    const timer3 = setTimeout(() => setProgress(90), 500);
    const timer4 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setProgress(0);
      }, 200);
    }, 700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [pathname, searchParams, mounted]);

  // Listen to link clicks for immediate feedback
  useEffect(() => {
    if (!mounted) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]');
      if (link) {
        const href = (link as HTMLAnchorElement).href;
        const currentUrl = window.location.href;
        // Only show progress for internal navigation
        if (href.startsWith(window.location.origin) && href !== currentUrl && !href.includes('#')) {
          setProgress(5);
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [mounted]);

  if (!mounted || progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/50 transition-all duration-150 ease-out"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}

