"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm8.98 1.53a1.17 1.17 0 1 1 0 2.34 1.17 1.17 0 0 1 0-2.34ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8Z" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.1 0 2.25.2 2.25.2v2.45h-1.27c-1.25 0-1.64.78-1.64 1.57v1.88h2.79l-.45 2.91h-2.34V22C18.34 21.24 22 17.08 22 12.06z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.36h-3.3v13.41a2.95 2.95 0 1 1-2.95-2.95c.23 0 .45.03.67.08V9.52a6.27 6.27 0 0 0-.67-.04A6.29 6.29 0 1 0 15.86 15V8.2A8.11 8.11 0 0 0 21 10.03V6.79a4.84 4.84 0 0 1-1.41-.1z" />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.52 3.48A11.78 11.78 0 0 0 12.1 0C5.54 0 .2 5.33.2 11.9c0 2.1.54 4.15 1.57 5.96L0 24l6.33-1.66a11.78 11.78 0 0 0 5.77 1.48h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.49-8.42zM12.1 21.82h-.01a9.85 9.85 0 0 1-5.02-1.37l-.36-.21-3.75.98 1-3.65-.24-.37A9.83 9.83 0 0 1 2.2 11.9C2.2 6.43 6.63 2 12.1 2c2.65 0 5.14 1.03 7.01 2.9a9.84 9.84 0 0 1 2.9 7c0 5.47-4.44 9.92-9.91 9.92zm5.44-7.45c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47a8.96 8.96 0 0 1-1.66-2.07c-.17-.3-.02-.46.13-.6.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.1 4.5.71.3 1.27.49 1.7.63.72.23 1.38.2 1.9.12.58-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.12-.28-.2-.58-.35z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.9 2H22l-6.77 7.73L23.2 22h-6.26l-4.9-6.62L6.25 22H3.14l7.24-8.28L.8 2h6.43l4.43 6.01L18.9 2zm-1.1 18h1.72L6.31 3.9H4.47L17.8 20z" />
  </svg>
);

const footerExploreLinks = [
  { label: 'Updates', href: '/community/updates' },
  { label: 'Events', href: '/community/events' },
  { label: 'Contact', href: '/contact' },
];

const footerCommunityLinks = [
  { label: 'Featured alumni', href: '/community/alumni' },
  { label: 'Talent & business', href: '/community/students' },
  { label: 'Gallery', href: '/community/gallery' },
];

const SOCIAL_LINKS = {
  facebook: {
    href: 'https://www.facebook.com/profile.php?id=61575142077443',
    label: 'Follow us on Facebook',
    enabled: true,
  },
  instagram: {
    href: 'https://www.instagram.com/mamsa213?igsh=MTBpNHFlZHZrbmM3ZQ==',
    label: 'Follow us on Instagram',
    enabled: true,
  },
  tiktok: {
    href: 'https://www.tiktok.com/@mamsa985?_r=1&_t=ZS-95Wpgj7K2K1',
    label: 'Follow us on TikTok',
    enabled: true,
  },
  whatsapp: {
    href: 'https://wa.me/256764922070',
    label: 'Chat with us on WhatsApp',
    enabled: true,
  },
  x: {
    href: 'https://x.com/mamsafraternity',
    label: 'Follow us on X',
    enabled: true,
  },
} as const;

const socialEntries = [
  { key: 'facebook', icon: FacebookIcon, text: 'Facebook' },
  { key: 'instagram', icon: InstagramIcon, text: 'Instagram' },
  { key: 'tiktok', icon: TikTokIcon, text: 'TikTok' },
  { key: 'whatsapp', icon: WhatsAppIcon, text: 'WhatsApp' },
  { key: 'x', icon: XIcon, text: 'X / Twitter' },
] as const;

export default function PublicFooter() {
  const [copyrightYear, setCopyrightYear] = useState<number | null>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setCopyrightYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-emerald-950 text-emerald-50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 text-center md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-2 md:text-center lg:col-span-1 lg:text-left">
            <span className="relative mx-auto mb-4 block h-16 w-16 overflow-hidden rounded-full border-2 border-emerald-700 bg-emerald-900/60 shadow-lg shadow-emerald-900/40 lg:mx-0">
            {!logoError ? (
              <img
                src="/images/mamsa-logo.JPG"
                alt="MAMSA logo"
                className="h-full w-full object-cover"
                loading="lazy"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-700">
                <span className="text-xs font-bold text-white">M</span>
              </div>
            )}
            </span>
            <p className="text-xl font-bold tracking-widest text-white">MAMSA</p>
            <p className="mt-1 text-sm italic text-emerald-300">Olu Alu Vu Ozoni</p>
            <p className="mx-auto mt-4 max-w-[220px] text-xs text-emerald-400 lg:mx-0">
              Connecting our alumni, students and community across generations.
            </p>
            <div className="mt-6 flex justify-center gap-3 lg:justify-start">
              {socialEntries
                .filter(({ key }) => SOCIAL_LINKS[key].enabled)
                .map(({ key, icon: Icon }) => (
                  <a
                    key={key}
                    href={SOCIAL_LINKS[key].href}
                    aria-label={SOCIAL_LINKS[key].label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 transition-colors duration-200 hover:bg-emerald-600"
                  >
                    <Icon className="h-4 w-4 text-emerald-300" />
                  </a>
                ))}
            </div>
          </div>

          <div className="text-left">
            <p className="mb-4 border-b border-emerald-800 pb-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Explore
            </p>
            <nav aria-label="Site sections">
              <ul className="space-y-2">
                {footerExploreLinks.map((item) => (
                  <li key={item.href} className="group">
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-2 text-sm text-emerald-300 transition-colors duration-150 hover:text-white"
                    >
                      <ChevronRight
                        className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="text-left">
            <p className="mb-4 border-b border-emerald-800 pb-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Community
            </p>
            <nav aria-label="Community">
              <ul className="space-y-2">
                {footerCommunityLinks.map((item) => (
                  <li key={item.href} className="group">
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-2 text-sm text-emerald-300 transition-colors duration-150 hover:text-white"
                    >
                      <ChevronRight
                        className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="text-left md:col-span-2 lg:col-span-1">
            <p className="mb-4 border-b border-emerald-800 pb-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Get in touch
            </p>
            <p className="text-xs leading-relaxed text-emerald-400">
              Uganda, East Africa
              <br />
              Building meaningful connections through mentorship, service, and shared growth.
            </p>
            <p className="mb-2 mt-4 text-xs text-emerald-400">Follow us</p>
            <div className="space-y-2">
              {socialEntries
                .filter(({ key }) => SOCIAL_LINKS[key].enabled)
                .map(({ key, icon: Icon, text }) => (
                  <a
                    key={`pill-${key}`}
                    href={SOCIAL_LINKS[key].href}
                    aria-label={SOCIAL_LINKS[key].label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-full items-center gap-2 rounded-full bg-emerald-800 px-3 text-sm text-emerald-200 transition-colors duration-200 hover:bg-emerald-600 hover:text-white md:w-auto"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{text}</span>
                  </a>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-emerald-800/60" />

      <div className="bg-emerald-900/40 px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-emerald-500 md:flex-row">
          <p>© {copyrightYear ?? ''} MAMSA. All rights reserved. · Privacy</p>
          <p>Built with ♥ for the MAMSA community</p>
        </div>
      </div>
    </footer>
  );
}

