import { requireSession } from '@/lib/auth';
import AboutPage from '../../about/page';

export default async function AdminAboutPage() {
  await requireSession();
  return <AboutPage />;
}