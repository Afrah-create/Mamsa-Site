import { requireSession } from '@/lib/auth';
import ProfilePage from '../../profile/page';

export default async function AdminProfilePage() {
  await requireSession();
  return <ProfilePage />;
}