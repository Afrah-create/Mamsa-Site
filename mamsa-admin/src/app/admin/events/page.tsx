import { requireSession } from '@/lib/auth';
import EventsPage from '../../events/page';

export default async function AdminEventsPage() {
  await requireSession();
  return <EventsPage />;
}