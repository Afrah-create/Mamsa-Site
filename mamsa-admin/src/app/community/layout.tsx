import PublicFooter from '@/components/PublicFooter';
import PublicNavbar from '@/components/PublicNavbar';

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <PublicNavbar />
      <main className="flex-1 pt-24">{children}</main>
      <PublicFooter />
    </div>
  );
}

