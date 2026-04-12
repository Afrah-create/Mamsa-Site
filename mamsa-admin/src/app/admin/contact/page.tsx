import { requireSession } from '@/lib/auth';
import AdminSiteContactPageClient from '@/components/admin/contact/AdminSiteContactPageClient';

export default async function AdminContactPage() {
  await requireSession();
  return <AdminSiteContactPageClient />;
}
