import { requireSession } from '@/lib/auth';
import AdminSettingsPageClient from '@/components/admin/settings/AdminSettingsPageClient';

export default async function AdminSettingsPage() {
  await requireSession();
  return <AdminSettingsPageClient />;
}
