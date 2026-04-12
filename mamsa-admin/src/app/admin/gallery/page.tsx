import { requireSession } from '@/lib/auth';
import GalleryAdminList from '@/components/admin/gallery/GalleryAdminList';

export default async function AdminGalleryPage() {
  await requireSession();
  return <GalleryAdminList />;
}
