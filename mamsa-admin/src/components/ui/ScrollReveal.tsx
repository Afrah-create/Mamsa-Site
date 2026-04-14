'use client';

import { useEffect, useRef, useState } from 'react';

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  once?: boolean;
  threshold?: number;
};

type LazySectionProps = {
  children: React.ReactNode;
  className?: string;
  placeholderClassName?: string;
  minHeightClassName?: string;
  threshold?: number;
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  duration = 520,
  y = 16,
  once = true,
  threshold = 0.14,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold]);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
        transform: visible ? 'translate3d(0, 0, 0)' : `translate3d(0, ${y}px, 0)`,
      }}
      className={[
        'will-change-transform will-change-opacity transition-all ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:opacity-100 motion-reduce:transition-none',
        visible ? 'opacity-100' : 'opacity-0',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </div>
  );
}

export function LazySection({
  children,
  className,
  placeholderClassName,
  minHeightClassName = 'min-h-[320px]',
  threshold = 0.08,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '220px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className={className}>
      {ready ? (
        children
      ) : (
        <div
          className={[
            minHeightClassName,
            'w-full animate-pulse rounded-2xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100',
            placeholderClassName ?? '',
          ].join(' ')}
          aria-hidden
        />
      )}
    </div>
  );
}

