import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import NavigationProgress from '@/components/NavigationProgress';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MAMSA Admin Portal',
  description: 'MAMSA Admin Portal for content management',
  icons: {
    icon: [{ url: '/images/mamsa-logo.JPG', type: 'image/jpeg' }],
    shortcut: ['/images/mamsa-logo.JPG'],
    apple: [{ url: '/images/mamsa-logo.JPG', type: 'image/jpeg' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
