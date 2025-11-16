'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ 
  message, 
  type = 'success', 
  isVisible, 
  onClose, 
  duration = 4000 
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      iconPath: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
      iconBg: 'bg-red-100',
      iconPath: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      iconBg: 'bg-blue-100',
      iconPath: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: 'text-amber-600',
      iconBg: 'bg-amber-100',
      iconPath: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      ),
    },
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed top-4 right-4 z-[10000] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md flex items-start gap-3`}>
        <div className={`${styles.iconBg} flex-shrink-0 rounded-full p-1.5`}>
          <svg
            className={`h-5 w-5 ${styles.icon}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {styles.iconPath}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${styles.text}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${styles.text} hover:opacity-70 transition-opacity`}
          aria-label="Close notification"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

