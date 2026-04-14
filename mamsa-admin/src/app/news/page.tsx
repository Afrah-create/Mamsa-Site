'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Archive,
  CheckCircle,
  Clock,
  FileText,
  LayoutGrid,
  List,
  Newspaper,
  PenLine,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadingState from '@/components/AdminLoadingState';
import ConfirmModal from '@/components/ConfirmModal';
import NewsModal from '@/components/NewsModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { adminRequest } from '@/lib/admin-api';
import { resolveImageSrc } from '@/lib/image-utils';
import { requireAuth, type SessionUser } from '@/lib/session-manager';
import type { NewsArticle, NewsListResponse } from '@/types/news';

type SortKey = 'newest' | 'oldest' | 'az' | 'za';

const statusStyles: Record<NewsArticle['status'], string> = {
  published: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-amber-100 text-amber-700',
  archived: 'bg-gray-100 text-gray-500',
};

function toLabel(status: NewsArticle['status']): string {
  if (status === 'published') return 'Published';
  if (status === 'draft') return 'Draft';
  return 'Archived';
}

export default function NewsPage() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<NewsArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | NewsArticle['status']>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewsArticle | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const v = localStorage.getItem('news-view-mode');
      if (v === 'grid' || v === 'list') setViewMode(v);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('news-view-mode', viewMode);
    } catch {}
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
      const q = new URLSearchParams({ page: String(page), limit: '16' });
      if (appliedSearch) q.set('search', appliedSearch);
      if (statusFilter !== 'all') q.set('status', statusFilter);
      const data = await adminRequest<NewsListResponse>(`/api/admin/news?${q.toString()}`);
      setRows(data?.items ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 0);
      setImageErrors({});
    } catch (error) {
      console.error(error);
      setRows([]);
      showToast('Failed to load news articles.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearch, statusFilter, showToast]);

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
  }, [load, router]);

  const sortedRows = useMemo(() => {
    const items = [...rows];
    if (sortBy === 'oldest') return items.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    if (sortBy === 'az') return items.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'za') return items.sort((a, b) => b.title.localeCompare(a.title));
    return items.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [rows, sortBy]);

  const stats = useMemo(
    () => ({
      total,
      published: rows.filter((r) => r.status === 'published').length,
      drafts: rows.filter((r) => r.status === 'draft').length,
      archived: rows.filter((r) => r.status === 'archived').length,
    }),
    [rows, total],
  );

  const onSave = async (payload: Omit<NewsArticle, 'id' | 'created_at' | 'updated_at'>) => {
    const body = {
      title: payload.title,
      content: payload.content ?? '',
      excerpt: payload.excerpt ?? '',
      author: payload.author ?? 'Admin',
      tags: payload.tags ?? [],
      date: payload.published_at ?? new Date().toISOString(),
      image: payload.featured_image,
      featured: payload.status === 'published',
    };
    if (editing) {
      await adminRequest(`/api/admin/news/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast(`Article '${payload.title}' updated`, 'success');
    } else {
      await adminRequest('/api/admin/news', { method: 'POST', body: JSON.stringify(body) });
      showToast(`Article '${payload.title}' published`, 'success');
    }
    setShowModal(false);
    setEditing(null);
    afterMutation();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminRequest(`/api/admin/news/${deleteTarget.id}`, { method: 'DELETE' });
      showToast('Article deleted', 'success');
      setDeleteTarget(null);
      afterMutation();
    } catch (error) {
      console.error(error);
      showToast('Failed to delete article', 'error');
    }
  };

  if (loadingUser || !user) return <AdminLoadingState />;

  return (
    <AdminLayout user={user}>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
      <NewsModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        editingItem={editing}
        onSave={onSave}
      />
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete article"
        message={deleteTarget ? `Delete '${deleteTarget.title}'? This cannot be undone.` : ''}
        confirmText="Delete Article"
      />

      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">News Articles</h1>
            <p className="mt-1 text-sm text-gray-500">Manage and publish news for the site</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <PenLine className="h-4 w-4" />
              Write Article
            </button>
            <div className="flex rounded-lg border border-gray-200 bg-white p-1">
              <button type="button" className={`rounded-md p-2 ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-gray-600'}`} onClick={() => setViewMode('grid')} aria-label="Grid view">
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button type="button" className={`rounded-md p-2 ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'text-gray-600'}`} onClick={() => setViewMode('list')} aria-label="List view">
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Total', value: stats.total, icon: FileText, style: 'bg-gray-100 text-gray-600' },
            { label: 'Published', value: stats.published, icon: CheckCircle, style: 'bg-emerald-100 text-emerald-700' },
            { label: 'Drafts', value: stats.drafts, icon: Clock, style: 'bg-amber-100 text-amber-700' },
            { label: 'Archived', value: stats.archived, icon: Archive, style: 'bg-gray-100 text-gray-500' },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <span className={`rounded-full p-2 ${c.style}`}><Icon className="h-4 w-4" /></span>
                <div><p className="text-2xl font-bold text-gray-900">{c.value}</p><p className="text-xs uppercase tracking-wide text-gray-500">{c.label}</p></div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search articles..." className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-9 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            {searchInput ? <button type="button" onClick={() => setSearchInput('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="Clear search"><X className="h-4 w-4" /></button> : null}
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as 'all' | NewsArticle['status']); setPage(1); }} className="min-w-[150px] rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
            <option value="all">All</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="min-w-[150px] rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="az">A–Z</option><option value="za">Z–A</option>
          </select>
        </div>

        {loading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"><div className="aspect-video animate-pulse bg-gray-200" /><div className="space-y-2 p-3"><div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" /><div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" /><div className="h-2 w-1/3 animate-pulse rounded bg-gray-200" /></div></div>)}</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex items-center gap-3 border-b border-gray-100 p-3 last:border-b-0"><div className="h-10 w-16 animate-pulse rounded-lg bg-gray-200" /><div className="flex-1 space-y-2"><div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" /><div className="h-2 w-1/2 animate-pulse rounded bg-gray-200" /></div></div>)}</div>
          )
        ) : sortedRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center">
            <Newspaper className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-lg font-medium text-gray-500">No articles found</p>
            {appliedSearch ? <p className="mt-1 text-sm text-gray-500">No results for '{appliedSearch}' <button type="button" className="text-emerald-600 hover:text-emerald-700" onClick={() => setSearchInput('')}>Clear search</button></p> : null}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedRows.map((item) => {
              const src = item.featured_image ? resolveImageSrc(item.featured_image) : '';
              const hasError = imageErrors[item.id];
              const tags = item.tags ?? [];
              return (
                <article key={item.id} className="flex h-[305px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
                  <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                    {src && !hasError ? <Image src={src} alt={item.alt_text ?? item.title} fill className="object-cover" sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw" unoptimized={/^https?:\/\//i.test(src)} onError={() => setImageErrors((prev) => ({ ...prev, [item.id]: true }))} /> : <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-100 text-gray-300"><Newspaper className="h-8 w-8" /></div>}
                    <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.status]}`}>{toLabel(item.status)}</span>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-1 text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {item.author ?? '—'}</p>
                    <div className="mt-2 flex flex-wrap gap-1">{tags.slice(0, 2).map((tag) => <span key={tag} className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">#{tag}</span>)}{tags.length > 2 ? <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">+{tags.length - 2}</span> : null}</div>
                    <div className="mt-auto flex items-center justify-end gap-2 text-xs">
                      <button type="button" onClick={() => { setEditing(item); setShowModal(true); }} className="inline-flex items-center gap-1 text-emerald-600 opacity-60 hover:text-emerald-800 hover:opacity-100"><Pencil className="h-3 w-3" />Edit</button>
                      <span className="text-gray-300">•</span>
                      <button type="button" onClick={() => setDeleteTarget(item)} className="inline-flex items-center gap-1 text-red-500 opacity-60 hover:text-red-700 hover:opacity-100"><Trash2 className="h-3 w-3" />Delete</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-3 py-2">Image</th><th className="px-3 py-2">Title</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Author</th><th className="px-3 py-2">Date</th><th className="px-3 py-2 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {sortedRows.map((item) => {
                  const src = item.featured_image ? resolveImageSrc(item.featured_image) : '';
                  return (
                    <tr key={item.id}>
                      <td className="px-3 py-2">{src ? <Image src={src} alt={item.alt_text ?? item.title} width={64} height={40} className="h-10 w-16 rounded-lg object-cover" /> : <div className="flex h-10 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-gray-100 text-gray-300"><Newspaper className="h-4 w-4" /></div>}</td>
                      <td className="max-w-[320px] px-3 py-2"><p className="truncate text-sm font-medium text-gray-900">{item.title}</p><p className="line-clamp-1 text-xs text-gray-400">{item.excerpt ?? item.content ?? ''}</p></td>
                      <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.status]}`}>{toLabel(item.status)}</span></td>
                      <td className="px-3 py-2 text-xs text-gray-500">{item.author ?? '—'}</td>
                      <td className="px-3 py-2 text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-3 py-2"><div className="flex justify-end gap-1"><button type="button" onClick={() => { setEditing(item); setShowModal(true); }} className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => setDeleteTarget(item)} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? <div className="flex items-center justify-center gap-3"><button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="text-sm text-gray-600">Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40">Next</button></div> : null}
      </div>
    </AdminLayout>
  );
}
