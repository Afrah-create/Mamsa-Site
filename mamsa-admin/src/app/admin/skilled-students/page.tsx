import { requireSession } from '@/lib/auth';
import SkilledStudentsAdminList from '@/components/admin/skilled-students/SkilledStudentsAdminList';

export default async function AdminSkilledStudentsPage() {
  await requireSession();
  return <SkilledStudentsAdminList />;
}
