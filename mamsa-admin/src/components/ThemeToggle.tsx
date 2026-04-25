'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'mamsa-theme';

function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
}

type Props = {
  compact?: boolean;
  className?: string;
};

export default function ThemeToggle({ compact = false, className = '' }: Props) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const initial = getPreferredTheme();
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const label = mounted ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : 'Toggle theme';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className={[
        'inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-white/90 text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-100 dark:hover:bg-emerald-800/70',
        compact ? 'h-9 w-9' : 'h-10 w-10',
        className,
      ].join(' ')}
    >
      {mounted && theme === 'dark' ? <Sun className={compact ? 'h-4 w-4' : 'h-5 w-5'} /> : <Moon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />}
    </button>
  );
}
