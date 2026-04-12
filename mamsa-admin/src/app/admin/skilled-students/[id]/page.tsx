import { requireSession } from '@/lib/auth';
import SkilledStudentDetailAdmin from '@/components/admin/skilled-students/SkilledStudentDetailAdmin';

export default async function AdminSkilledStudentDetailPage() {
  await requireSession();
  return <SkilledStudentDetailAdmin />;
}
