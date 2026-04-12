'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadingState from '@/components/AdminLoadingState';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { adminRequest } from '@/lib/admin-api';
import { requireAuth, type SessionUser } from '@/lib/session-manager';
import CreateStudentModal from './CreateStudentModal';
import EditStudentModal from './EditStudentModal';
import { rowToStudentRecord, type SkilledStudentRecord } from './student-form-utils';

type ListPayload = {
  items: Record<string, unknown>[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function SkilledStudentsAdminList() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingStudent, setEditingStudent] = useState<SkilledStudentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SkilledStudentRecord | null>(null);
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
      const q = new URLSearchParams({ page: '1', limit: '50' });
      if (appliedSearch.trim()) q.set('search', appliedSearch.trim());
      const data = await adminRequest<ListPayload>(`/api/admin/skilled-students?${q.toString()}`);
      setRows(data?.items ?? []);
      setTotal(data?.total ?? 0);
    } catch (e) {
      console.error(e);
      setRows([]);
      setTotal(0);
      showToast('Failed to load skilled students.', 'error');
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, showToast]);

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

  const openEdit = (row: Record<string, unknown>) => {
    try {
      setEditingStudent(rowToStudentRecord(row));
      setShowEdit(true);
    } catch {
      showToast('Could not open editor for this row.', 'error');
    }
  };

  const confirmDeleteStudent = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminRequest(`/api/admin/skilled-students/${deleteTarget.id}`, { method: 'DELETE' });
      showToast('Student deleted.', 'success');
      setDeleteTarget(null);
      afterMutation();
    } catch (e) {
      console.error(e);
      showToast('Failed to delete student.', 'error');
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

      <CreateStudentModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          showToast('Student created.', 'success');
          afterMutation();
        }}
      />

      <EditStudentModal
        isOpen={showEdit}
        student={editingStudent}
        onClose={() => {
          setShowEdit(false);
          setEditingStudent(null);
        }}
        onSuccess={() => {
          showToast('Student updated.', 'success');
          afterMutation();
        }}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={confirmDeleteStudent}
        title="Delete student"
        message={
          deleteTarget
            ? `Permanently delete ${deleteTarget.full_name}? This removes all payment records and the Cloudinary image.`
            : ''
        }
        confirmText="Delete"
        loading={deleteLoading}
      />

      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Skilled students</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage directory listings and payments. Public site shows only active students with a valid payment window.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Add student
            </button>
            <Link
              href="/community/students"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              View public directory
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAppliedSearch(searchInput.trim());
              }
            }}
            placeholder="Search name, email, or title…"
            className="min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-md"
          />
          <button
            type="button"
            onClick={() => setAppliedSearch(searchInput.trim())}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Search
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      No skilled students yet. Click &quot;Add student&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const id = Number(r.id);
                    const isActive = Number(r.is_active);
                    const isFeatured = Number(r.is_featured);
                    return (
                      <tr key={id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{String(r.full_name ?? '')}</div>
                          <div className="text-xs text-gray-500">{String(r.email ?? '')}</div>
                        </td>
                        <td className="px-4 py-3 capitalize text-gray-700">{String(r.category ?? '')}</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              isActive
                                ? 'inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800'
                                : 'inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600'
                            }
                          >
                            {isActive ? 'On' : 'Off'}
                          </span>
                          {isFeatured ? (
                            <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              Featured
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {r.latest_payment_status != null ? String(r.latest_payment_status) : '—'}
                          {r.latest_payment_expiry != null ? (
                            <div className="text-gray-400">Expires {String(r.latest_payment_expiry)}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(r)}
                              className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50"
                              title="Edit"
                              aria-label="Edit"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  setDeleteTarget(rowToStudentRecord(r));
                                } catch {
                                  showToast('Could not prepare delete.', 'error');
                                }
                              }}
                              className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                              title="Delete"
                              aria-label="Delete"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                            <Link
                              href={`/admin/skilled-students/${id}`}
                              className="rounded-lg p-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
                            >
                              Open
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {total > 0 ? <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">{total} total</p> : null}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
