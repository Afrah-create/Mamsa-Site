import Link from 'next/link';

const footerLinks = [
  { label: 'Updates', href: '/community/updates' },
  { label: 'Events', href: '/community/events' },
  { label: 'Leadership', href: '/community/leadership' },
  { label: 'Gallery', href: '/community/gallery' },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-emerald-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold text-emerald-700">MAMSA</p>
          <p className="mt-2 text-sm text-gray-500">
            Empowering medical students to lead, learn, and serve the community.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600">
          {footerLinks.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-emerald-600">
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="transition hover:text-emerald-600">
            Admin Login
          </Link>
        </nav>
      </div>
      <div className="border-t border-emerald-100 bg-emerald-50/60 py-4 text-center text-xs text-emerald-800">
        © {new Date().getFullYear()} MAMSA. All rights reserved.
      </div>
    </footer>
  );
}

