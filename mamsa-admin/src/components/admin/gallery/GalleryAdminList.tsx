'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ImageIcon,
  ImagePlus,
  LayoutGrid,
  List,
  Pencil,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadingState from '@/components/AdminLoadingState';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { adminRequest } from '@/lib/admin-api';
import { resolveImageSrc } from '@/lib/image-utils';
import { requireAuth, type SessionUser } from '@/lib/session-manager';
import type { GalleryItem, GalleryListResponse } from '@/types/gallery';
import CreateGalleryModal from './CreateGalleryModal';
import EditGalleryModal from './EditGalleryModal';

export default function GalleryAdminList() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<GalleryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState({ active: 0, featured: 0, categoriesCount: 0 });
  const [categoryTab, setCategoryTab] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem('gallery-view-mode');
      if (v === 'table' || v === 'grid') setViewMode(v);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('gallery-view-mode', viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setAppliedSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

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
      if (appliedSearch) q.set('search', appliedSearch);
      if (categoryTab && categoryTab !== 'all') q.set('category', categoryTab);
      const data = await adminRequest<GalleryListResponse>(`/api/admin/gallery?${q.toString()}`);
      setRows(data?.items ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 0);
      setCategories(data?.categories ?? []);
      setStats(
        data?.stats ?? {
          active: 0,
          featured: 0,
          categoriesCount: (data?.categories ?? []).length,
        },
      );
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
      await adminRequest(`/api/admin/gallery/${deleteTarget.id}`, { method: 'DELETE' });
      const label = deleteTarget.title;
      showToast(`Photo "${label}" removed successfully.`, 'success');
      setDeleteTarget(null);
      afterMutation();
    } catch (e) {
      console.error(e);
      showToast('Failed to delete.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const imgSrc = useCallback((url: string | null) => {
    const raw = url?.trim();
    if (!raw) return '';
    return resolveImageSrc(raw);
  }, []);

  const emptyMessage = useMemo(() => {
    if (appliedSearch) {
      return { title: `No results for "${appliedSearch}"`, showClear: true };
    }
    return { title: 'No gallery items found', showClear: false };
  }, [appliedSearch]);

  if (loadingUser || !user) {
    return <AdminLoadingState />;
  }

  return (
    <AdminLayout user={user}>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />

      <CreateGalleryModal
        isOpen={showCreate}
        existingCategories={categories}
        onClose={() => setShowCreate(false)}
        onSuccess={({ title }) => {
          showToast(`Photo "${title}" added successfully`, 'success');
          afterMutation();
        }}
      />

      <EditGalleryModal
        isOpen={showEdit}
        item={editing}
        existingCategories={categories}
        onClose={() => {
          setShowEdit(false);
          setEditing(null);
        }}
        onSuccess={({ title }) => {
          showToast(`Photo "${title}" updated successfully`, 'success');
          afterMutation();
        }}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete gallery item"
        message={deleteTarget ? `Delete “${deleteTarget.title}”?` : ''}
        confirmText="Delete"
        loading={deleteLoading}
      />

      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
            <p className="mt-1 text-sm text-gray-500">Manage photos and media for the site</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <ImagePlus className="h-5 w-5 shrink-0" aria-hidden />
            Add Item
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Items', value: total },
            { label: 'Active', value: stats.active },
            { label: 'Featured', value: stats.featured },
            { label: 'Categories', value: stats.categoriesCount },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => {
              setCategoryTab('all');
              setPage(1);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
              categoryTab === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
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
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                categoryTab === c
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title or description…"
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <div className="flex shrink-0 gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-2 ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Table view"
              onClick={() => setViewMode('table')}
              className={`rounded-md p-2 ${viewMode === 'table' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                  <div className="aspect-square animate-pulse bg-gray-200" />
                  <div className="space-y-2 p-3">
                    <div className="h-4 w-[75%] animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-[50%] animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="divide-y divide-gray-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-[33%] animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-[25%] animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 py-16 text-center">
            <ImageIcon className="h-12 w-12 text-gray-300" aria-hidden />
            <p className="mt-3 text-sm font-medium text-gray-800">{emptyMessage.title}</p>
            {emptyMessage.showClear ? (
              <button
                type="button"
                className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                onClick={() => {
                  setSearchInput('');
                  setAppliedSearch('');
                  setPage(1);
                }}
              >
                Clear search
              </button>
            ) : null}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {rows.map((item) => {
              const src = imgSrc(item.image_url);
              const featured = item.is_featured === 1;
              return (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <ImageIcon className="h-10 w-10" aria-hidden />
                      </div>
                    )}
                    {featured ? (
                      <span className="absolute right-2 top-2 rounded-full bg-black/40 p-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden />
                      </span>
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 translate-y-full bg-black/60 p-3 transition-transform duration-300 group-hover:translate-y-0">
                      <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                      {item.category ? (
                        <span className="mt-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
                          {item.category}
                        </span>
                      ) : null}
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg bg-white/90 p-1.5 text-emerald-700 shadow hover:bg-white"
                          aria-label="Edit"
                          onClick={() => {
                            setEditing(item);
                            setShowEdit(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-white/90 p-1.5 text-red-600 shadow hover:bg-white"
                          aria-label="Delete"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-50 p-3">
                    <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="truncate text-xs text-gray-500">{item.category ?? '—'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Tags</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((item) => {
                  const src = imgSrc(item.image_url);
                  const tags = item.tags ?? [];
                  const shown = tags.slice(0, 2);
                  const more = tags.length - shown.length;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-2">
                        {src ? (
                          <Image
                            src={src}
                            alt=""
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-lg object-cover"
                            unoptimized={/^https?:\/\//i.test(src)}
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-300">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-medium text-gray-900">{item.title}</td>
                      <td className="px-4 py-3 text-gray-600">{item.category ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {shown.map((t) => (
                            <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {t}
                            </span>
                          ))}
                          {more > 0 ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                              +{more} more
                            </span>
                          ) : null}
                          {tags.length === 0 ? <span className="text-xs text-gray-400">—</span> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {item.is_featured === 1 ? (
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-label="Featured" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            item.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(item);
                              setShowEdit(true);
                            }}
                            className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                            aria-label="Edit"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
