import { redirect } from 'next/navigation';

export default function AdminEntryRedirectPage() {
  redirect('/login?next=/admin');
}
