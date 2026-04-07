import { requireSession } from '@/lib/auth';
import LeadershipPage from '../../leadership/page';

export default async function AdminLeadershipPage() {
  await requireSession();
  return <LeadershipPage />;
}