import { requireSession } from '@/lib/auth';
import ContactManagementPage from '../../contact-management/page';

export default async function AdminContactPage() {
  await requireSession();
  return <ContactManagementPage />;
}