'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadingState from '@/components/AdminLoadingState';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { adminRequest } from '@/lib/admin-api';
import { requireAuth, type SessionUser } from '@/lib/session-manager';

const inputClass =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500';

export default function AdminSettingsPageClient() {
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [map, setMap] = useState<Record<string, string>>({});

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
      const data = await adminRequest<Record<string, string>>('/api/admin/settings');
      setMap(data && typeof data === 'object' ? { ...data } : {});
    } catch {
      showToast('Failed to load settings.', 'error');
      setMap({});
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

  const keys = Object.keys(map).sort((a, b) => a.localeCompare(b));

  const setKey = (k: string, v: string) => {
    setMap((prev) => ({ ...prev, [k]: v }));
  };

  const addKey = () => {
    const base = 'new_setting';
    let k = base;
    let n = 1;
    while (k in map) {
      k = `${base}_${n++}`;
    }
    setMap((prev) => ({ ...prev, [k]: '' }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminRequest('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings: map }),
      });
      showToast('Settings saved.', 'success');
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loadingUser || !user) {
    return <AdminLoadingState />;
  }

  return (
    <AdminLayout user={user}>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site settings</h1>
          <p className="mt-1 text-sm text-gray-500">Key–value pairs stored in the database (e.g. site name, tagline).</p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {keys.length === 0 ? (
              <p className="text-sm text-gray-500">No settings yet. Add a key below.</p>
            ) : (
              keys.map((k) => (
                <label key={k} className="block text-sm font-medium text-gray-700">
                  {k}
                  <input className={`${inputClass} mt-1`} value={map[k] ?? ''} onChange={(e) => setKey(k, e.target.value)} />
                </label>
              ))
            )}
            <button type="button" onClick={addKey} className="text-sm font-semibold text-emerald-600 hover:underline">
              + Add setting key
            </button>
            <div className="border-t border-gray-100 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
