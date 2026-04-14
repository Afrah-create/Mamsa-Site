'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Search, Trash2, UserPlus, Users } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { adminRequest } from '@/lib/admin-api';
import { resolveImageSrc } from '@/lib/image-utils';
import type { AdminUser } from '@/types/admin-user';
import { AvatarImage } from '@/components/ui/AvatarImage';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';

type ListPayload = { items: AdminUser[] };

const INITIAL_BG = [
  'bg-emerald-100 text-emerald-800',
  'bg-violet-100 text-violet-800',
  'bg-sky-100 text-sky-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-teal-100 text-teal-800',
];

function hashPick(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function avatarSrc(u: AdminUser): string | null {
  const raw = u.avatar_url?.trim();
  if (!raw) return null;
  return resolveImageSrc(raw);
}

function formatJoined(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

type Props = {
  currentUserId: number;
  sessionUser: import('@/lib/session-manager').SessionUser;
};

export default function UsersAdminList({ currentUserId, sessionUser }: Props) {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminRequest<ListPayload>('/api/admin/users');
      setRows(data?.items ?? []);
    } catch (e) {
      console.error(e);
      setRows([]);
      showToast('Could not load users. Refresh the page or try again in a moment.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const afterMutation = useCallback(() => {
    router.refresh();
    void load();
  }, [router, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.status === 'active').length;
    const inactiveOrSuspended = rows.filter((r) => r.status === 'inactive' || r.status === 'suspended').length;
    const superAdmins = rows.filter((r) => r.role === 'super_admin').length;
    return { total, active, inactiveOrSuspended, superAdmins };
  }, [rows]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.id === currentUserId) {
      showToast('You cannot delete your own account.', 'error');
      setDeleteTarget(null);
      return;
    }
    setDeleteLoading(true);
    try {
      await adminRequest(`/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
      const label = deleteTarget.full_name || deleteTarget.email;
      showToast(`${label} was removed from admin users.`, 'success');
      setDeleteTarget(null);
      afterMutation();
    } catch (e) {
      console.error(e);
      showToast('Delete failed. Check your connection and try again.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const roleBadge = (role: AdminUser['role']) => {
    if (role === 'super_admin') return 'bg-purple-100 text-purple-700';
    if (role === 'admin') return 'bg-emerald-100 text-emerald-700';
    return 'bg-blue-100 text-blue-700';
  };

  const statusDisplay = (status: AdminUser['status']) => {
    if (status === 'active') return { dot: 'bg-green-500', label: 'Active' };
    if (status === 'inactive') return { dot: 'bg-gray-400', label: 'Inactive' };
    return { dot: 'bg-red-500', label: 'Suspended' };
  };

  return (
    <AdminLayout user={sessionUser}>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />

      <CreateUserModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={({ fullName }) => {
          showToast(`${fullName} was added successfully.`, 'success');
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
        onSuccess={({ fullName }) => {
          showToast(`${fullName} was updated successfully.`, 'success');
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

      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
            <p className="mt-1 text-sm text-gray-500">Manage who can access and administer this site.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <UserPlus className="h-5 w-5 shrink-0" aria-hidden />
            <span className="max-sm:sr-only">Add User</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Users', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Inactive / Suspended', value: stats.inactiveOrSuspended },
            { label: 'Super Admins', value: stats.superAdmins },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{c.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Search users"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 sm:table-cell">Phone</th>
                <th className="hidden px-4 py-3 sm:table-cell">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-32 rounded bg-gray-200" />
                          <div className="h-3 w-44 rounded bg-gray-100" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-16 rounded-full bg-gray-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-20 rounded-full bg-gray-200" />
                    </td>
                    <td className="hidden px-4 py-4 sm:table-cell">
                      <div className="h-3 w-24 rounded bg-gray-200" />
                    </td>
                    <td className="hidden px-4 py-4 sm:table-cell">
                      <div className="h-3 w-20 rounded bg-gray-200" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="ml-auto h-8 w-16 rounded bg-gray-200" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-gray-500">
                    <Users className="mx-auto h-10 w-10 text-gray-300" aria-hidden />
                    <p className="mt-3 text-sm font-medium text-gray-700">No users found</p>
                    <p className="mt-1 text-xs text-gray-500">Try adjusting your search or add a new user.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const src = avatarSrc(r);
                  const initials = (r.full_name || r.email || '?').charAt(0).toUpperCase();
                  const bgClass = INITIAL_BG[hashPick(r.full_name || r.email) % INITIAL_BG.length];
                  const isSelf = r.id === currentUserId;
                  const st = statusDisplay(r.status);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-gray-100">
                            {src ? (
                              <AvatarImage src={src} name={r.full_name || r.email} size="md" />
                            ) : (
                              <span
                                className={`flex h-10 w-10 items-center justify-center text-sm font-semibold ${bgClass}`}
                              >
                                {initials}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">{r.full_name}</p>
                            <p className="truncate text-xs text-gray-500">{r.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${roleBadge(r.role)}`}>
                          {r.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${st.dot}`} aria-hidden />
                          {st.label}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">{r.phone ?? '—'}</td>
                      <td className="hidden px-4 py-3 text-xs text-gray-500 sm:table-cell">{formatJoined(r.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(r);
                              setShowEdit(true);
                            }}
                            className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            aria-label={`Edit ${r.full_name}`}
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            title={isSelf ? 'Cannot delete your own account' : `Delete ${r.full_name}`}
                            onClick={() => {
                              if (!isSelf) setDeleteTarget(r);
                            }}
                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={`Delete ${r.full_name}`}
                          >
                            <Trash2 className="h-5 w-5" />
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

      </div>
    </AdminLayout>
  );
}
