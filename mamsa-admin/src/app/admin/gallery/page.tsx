import { requireSession } from '@/lib/auth';
import GalleryPage from '../../gallery/page';

export default async function AdminGalleryPage() {
  await requireSession();
  return <GalleryPage />;
}