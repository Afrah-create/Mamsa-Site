import { requireSession } from '@/lib/auth';
import AdminAboutPageClient from '@/components/admin/about/AdminAboutPageClient';

export default async function AdminAboutPage() {
  await requireSession();
  return <AdminAboutPageClient />;
}
