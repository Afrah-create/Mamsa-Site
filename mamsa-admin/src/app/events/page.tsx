'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Calendar, LayoutGrid, List, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadingState from '@/components/AdminLoadingState';
import ConfirmModal from '@/components/ConfirmModal';
import EventModal from '@/components/EventModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { adminRequest } from '@/lib/admin-api';
import { publicAssetUrl } from '@/lib/upload';
import { requireAuth, type SessionUser } from '@/lib/session-manager';

type EventItem = {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  featured_image?: string | null;
  organizer: string;
  tags: string[];
  created_at: string;
};

type EventModalPayload = {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  featured_image?: string;
  capacity?: number;
  registration_required: boolean;
  registration_deadline?: string;
  organizer: string;
  contact_email?: string;
  contact_phone?: string;
  tags?: string[];
};

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((v) => String(v).trim()).filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
    } catch {
      return raw.split(',').map((v) => v.trim()).filter(Boolean);
    }
  }
  return [];
}

function normalizeEvent(raw: Record<string, unknown>): EventItem {
  return {
    id: Number(raw.id ?? 0),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    date: String(raw.date ?? ''),
    time: String(raw.time ?? ''),
    location: String(raw.location ?? ''),
    status: (raw.status as EventItem['status']) ?? 'upcoming',
    featured_image: (raw.featured_image as string | null) ?? (raw.image as string | null) ?? null,
    organizer: String(raw.organizer ?? ''),
    tags: normalizeTags(raw.tags),
    created_at: String(raw.created_at ?? new Date().toISOString()),
  };
}

export default function EventsPage() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<EventItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EventItem['status']>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setAppliedSearch(searchInput.trim().toLowerCase()), 400);
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
    setLoading(true);
    try {
      const data = await adminRequest<Record<string, unknown>[] | { items?: Record<string, unknown>[] }>('/api/admin/events');
      const list = Array.isArray(data) ? data : (data?.items ?? []);
      setRows(list.map(normalizeEvent));
    } catch (error) {
      console.error(error);
      setRows([]);
      showToast('Failed to load events', 'error');
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

  const filtered = useMemo(() => {
    return rows.filter((event) => {
      const q = appliedSearch;
      const matchQ =
        !q ||
        event.title.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q) ||
        event.location.toLowerCase().includes(q) ||
        event.organizer.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || event.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [rows, appliedSearch, statusFilter]);

  const onSave = (data: EventModalPayload) => {
    const save = async () => {
      const payload = { ...data, tags: data.tags ?? [] };
      if (editing) {
        await adminRequest(`/api/admin/events/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        showToast(`Event '${data.title}' updated`, 'success');
      } else {
        await adminRequest('/api/admin/events', { method: 'POST', body: JSON.stringify(payload) });
        showToast(`Event '${data.title}' created`, 'success');
      }
      setShowModal(false);
      setEditing(null);
      router.refresh();
      void load();
    };
    void save();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await adminRequest(`/api/admin/events/${deleteTarget.id}`, { method: 'DELETE' });
    showToast('Event deleted', 'success');
    setDeleteTarget(null);
    router.refresh();
    void load();
  };

  if (loadingUser || !user) return <AdminLoadingState />;

  return (
    <AdminLayout user={user}>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
      <EventModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        editingItem={
          editing
            ? {
                ...editing,
                featured_image: editing.featured_image ?? undefined,
                capacity: 0,
                registration_required: false,
                registration_deadline: '',
                contact_email: '',
                contact_phone: '',
              }
            : null
        }
        onSave={onSave}
      />
      <ConfirmModal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete event" message={deleteTarget ? `Delete '${deleteTarget.title}'? This cannot be undone.` : ''} confirmText="Delete Event" />

      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Events</h1><p className="mt-1 text-sm text-gray-500">Manage community events and activities</p></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setEditing(null); setShowModal(true); }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" />Add Event</button>
            <div className="flex rounded-lg border border-gray-200 bg-white p-1">
              <button type="button" className={`rounded-md p-2 ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-gray-600'}`} onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></button>
              <button type="button" className={`rounded-md p-2 ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'text-gray-600'}`} onClick={() => setViewMode('list')}><List className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search events..." className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-9 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            {searchInput ? <button type="button" onClick={() => setSearchInput('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100"><X className="h-4 w-4" /></button> : null}
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="min-w-[150px] rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
            <option value="all">All</option><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? <AdminLoadingState /> : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center"><Calendar className="h-12 w-12 text-gray-300" /><p className="mt-3 text-lg font-medium text-gray-500">No events found</p></div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((event) => {
              const src = event.featured_image ? publicAssetUrl(event.featured_image) : '';
              return (
                <article key={event.id} className="flex h-[300px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md">
                  <div className="relative aspect-video bg-gray-100">{src ? <Image src={src} alt={event.title} fill className="object-cover" unoptimized={/^https?:\/\//i.test(src)} /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-100 text-gray-300"><Calendar className="h-8 w-8" /></div>}</div>
                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{event.title}</h3>
                    <p className="mt-1 text-xs text-gray-400">{new Date(event.date).toLocaleDateString()} · {event.organizer || '—'}</p>
                    <p className="mt-2 line-clamp-2 text-xs text-gray-500">{event.description}</p>
                    <div className="mt-auto flex justify-end gap-2 text-xs">
                      <button type="button" onClick={() => { setEditing(event); setShowModal(true); }} className="inline-flex items-center gap-1 text-emerald-600 opacity-60 hover:text-emerald-800 hover:opacity-100"><Pencil className="h-3 w-3" />Edit</button>
                      <span className="text-gray-300">•</span>
                      <button type="button" onClick={() => setDeleteTarget(event)} className="inline-flex items-center gap-1 text-red-500 opacity-60 hover:text-red-700 hover:opacity-100"><Trash2 className="h-3 w-3" />Delete</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-3 py-2">Image</th><th className="px-3 py-2">Title</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Organizer</th><th className="px-3 py-2">Date</th><th className="px-3 py-2 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((event) => {
                  const src = event.featured_image ? publicAssetUrl(event.featured_image) : '';
                  return (
                    <tr key={event.id}>
                      <td className="px-3 py-2">{src ? <Image src={src} alt={event.title} width={64} height={40} className="h-10 w-16 rounded-lg object-cover" /> : <div className="flex h-10 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-gray-100 text-gray-300"><Calendar className="h-4 w-4" /></div>}</td>
                      <td className="max-w-[320px] px-3 py-2"><p className="truncate text-sm font-medium text-gray-900">{event.title}</p><p className="line-clamp-1 text-xs text-gray-400">{event.description}</p></td>
                      <td className="px-3 py-2 text-xs capitalize text-gray-600">{event.status}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{event.organizer || '—'}</td>
                      <td className="px-3 py-2 text-xs text-gray-400">{new Date(event.date).toLocaleDateString()}</td>
                      <td className="px-3 py-2"><div className="flex justify-end gap-1"><button type="button" onClick={() => { setEditing(event); setShowModal(true); }} className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => setDeleteTarget(event)} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
