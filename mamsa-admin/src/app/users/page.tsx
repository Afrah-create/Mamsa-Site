'use client';

import { useEffect, useState } from 'react';
import AdminLoadingState from '@/components/AdminLoadingState';
import UsersAdminList from '@/components/admin/users/UsersAdminList';
import { requireAuth, type SessionUser } from '@/lib/session-manager';

export default function UsersPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await requireAuth();
        if (!session || cancelled) return;
        setUser(session.user);
      } catch {
        if (!cancelled) window.location.href = '/login';
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (booting || !user) {
    return <AdminLoadingState />;
  }

  return <UsersAdminList currentUserId={user.id} sessionUser={user} />;
}
