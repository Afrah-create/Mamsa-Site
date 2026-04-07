import { requireSession } from '@/lib/auth';
import UsersPage from '../../users/page';

export default async function AdminUsersPage() {
  await requireSession();
  return <UsersPage />;
}