import { requireSession } from '@/lib/auth';
import NewsPage from '../../news/page';

export default async function AdminNewsPage() {
  await requireSession();
  return <NewsPage />;
}