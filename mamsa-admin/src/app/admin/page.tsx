import { requireSession } from '@/lib/auth';
import DashboardPage from '../dashboard/page';

export default async function AdminPage() {
  await requireSession();
  return <DashboardPage />;
}