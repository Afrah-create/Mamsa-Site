'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadingState from '@/components/AdminLoadingState';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { adminRequest } from '@/lib/admin-api';
import { publicAssetUrl } from '@/lib/upload';
import { requireAuth, type SessionUser } from '@/lib/session-manager';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';

type UserRow = {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  avatar_url: string | null;
  created_at: string;
};

type ListPayload = { items: UserRow[] };

export default function UsersAdminList() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const session = await requireAuth();
      if (!session) return;
      setUser(session.user);
    } catch {
      window.location.href = '/login';
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminRequest<ListPayload>('/api/admin/users');
      setRows(data?.items ?? []);
    } catch (e) {
      console.error(e);
      setRows([]);
      showToast('Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user, load]);

  const afterMutation = useCallback(() => {
    router.refresh();
    void load();
  }, [router, load]);

  const confirmDelete = async () => {
    if (!deleteTarget || !user) return;
    if (deleteTarget.id === user.id) {
      showToast('You cannot delete your own account.', 'error');
      setDeleteTarget(null);
      return;
    }
    setDeleteLoading(true);
    try {
      await adminRequest(`/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
      showToast('User deleted.', 'success');
      setDeleteTarget(null);
      afterMutation();
    } catch (e) {
      console.error(e);
      showToast('Failed to delete user.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loadingUser || !user) {
    return <AdminLoadingState />;
  }

  return (
    <AdminLayout user={user}>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />

      <CreateUserModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          showToast('User created.', 'success');
          afterMutation();
        }}
      />

      <EditUserModal
        isOpen={showEdit}
        item={editing}
        onClose={() => {
          setShowEdit(false);
          setEditing(null);
        }}
        onSuccess={() => {
          showToast('User updated.', 'success');
          afterMutation();
        }}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete user"
        message={deleteTarget ? `Permanently delete ${deleteTarget.full_name ?? deleteTarget.email}?` : ''}
        confirmText="Delete"
        loading={deleteLoading}
      />

      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin users</h1>
            <p className="mt-1 text-sm text-gray-500">Manage accounts that can sign in to this dashboard.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Add user
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Avatar</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const src = publicAssetUrl(r.avatar_url ?? '');
                    const isSelf = r.id === user.id;
                    return (
                      <tr key={r.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-2">
                          {src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={src} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{r.full_name ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{r.email}</td>
                        <td className="px-4 py-3 text-gray-600">{r.role}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{r.created_at ? String(r.created_at).slice(0, 10) : '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(r as unknown as Record<string, unknown>);
                                setShowEdit(true);
                              }}
                              className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                              aria-label="Edit"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              disabled={isSelf}
                              title={isSelf ? 'Cannot delete your own account' : 'Delete'}
                              onClick={() => {
                                if (!isSelf) setDeleteTarget(r);
                              }}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label="Delete"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
