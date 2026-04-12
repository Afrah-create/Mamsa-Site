import { requireSession } from '@/lib/auth';
import LeadershipAdminList from '@/components/admin/leadership/LeadershipAdminList';

export default async function AdminLeadershipPage() {
  await requireSession();
  return <LeadershipAdminList />;
}
