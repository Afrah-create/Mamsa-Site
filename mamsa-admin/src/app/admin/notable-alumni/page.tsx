import { requireSession } from '@/lib/auth';
import NotableAlumniAdminList from '@/components/admin/notable-alumni/NotableAlumniAdminList';

export default async function AdminNotableAlumniPage() {
  await requireSession();
  return <NotableAlumniAdminList />;
}
