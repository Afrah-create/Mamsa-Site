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
import CreateGalleryModal from './CreateGalleryModal';
import EditGalleryModal from './EditGalleryModal';

type ListPayload = {
  items: Record<string, unknown>[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  categories: string[];
};

export default function GalleryAdminList() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryTab, setCategoryTab] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
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
      const q = new URLSearchParams({
        page: String(page),
        limit: '20',
      });
      if (appliedSearch.trim()) q.set('search', appliedSearch.trim());
      if (categoryTab && categoryTab !== 'all') q.set('category', categoryTab);
      const data = await adminRequest<ListPayload>(`/api/admin/gallery?${q.toString()}`);
      setRows(data?.items ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 0);
      setCategories(data?.categories ?? []);
    } catch (e) {
      console.error(e);
      setRows([]);
      showToast('Failed to load gallery.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, categoryTab, showToast]);

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
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminRequest(`/api/admin/gallery/${Number(deleteTarget.id)}`, { method: 'DELETE' });
      showToast('Item deleted.', 'success');
      setDeleteTarget(null);
      afterMutation();
    } catch (e) {
      console.error(e);
      showToast('Failed to delete.', 'error');
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

      <CreateGalleryModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          showToast('Gallery item created.', 'success');
          afterMutation();
        }}
      />

      <EditGalleryModal
        isOpen={showEdit}
        item={editing}
        onClose={() => {
          setShowEdit(false);
          setEditing(null);
        }}
        onSuccess={() => {
          showToast('Gallery item updated.', 'success');
          afterMutation();
        }}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete gallery item"
        message={deleteTarget ? `Delete “${String(deleteTarget.title ?? '')}”?` : ''}
        confirmText="Delete"
        loading={deleteLoading}
      />

      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
            <p className="mt-1 text-sm text-gray-500">Manage gallery images and categories.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Add item
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => {
              setCategoryTab('all');
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-sm font-medium ${categoryTab === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCategoryTab(c);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1 text-sm font-medium ${categoryTab === c ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAppliedSearch(searchInput.trim());
                setPage(1);
              }
            }}
            placeholder="Search title or description…"
            className="min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none sm:max-w-md"
          />
          <button
            type="button"
            onClick={() => {
              setAppliedSearch(searchInput.trim());
              setPage(1);
            }}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
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
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                      No gallery items yet. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const id = Number(r.id);
                    const src = publicAssetUrl(r.image_url != null ? String(r.image_url) : '');
                    return (
                      <tr key={id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-2">
                          {src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={src} alt="" className="h-12 w-12 rounded object-cover" />
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{String(r.title ?? '')}</td>
                        <td className="px-4 py-3 text-gray-600">{String(r.category ?? '—')}</td>
                        <td className="px-4 py-3">{Number(r.featured) === 1 ? 'Yes' : '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(r);
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
                              onClick={() => setDeleteTarget(r)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
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
            {total > 0 ? <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">{total} total</p> : null}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border px-3 py-1 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border px-3 py-1 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
