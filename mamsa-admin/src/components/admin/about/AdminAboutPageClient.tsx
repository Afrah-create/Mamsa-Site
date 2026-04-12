'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadingState from '@/components/AdminLoadingState';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { adminRequest } from '@/lib/admin-api';
import { requireAuth, type SessionUser } from '@/lib/session-manager';

const taClass =
  'mt-1 block min-h-[120px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500';

type AboutPayload = { sections: Record<string, string> };

export default function AdminAboutPageClient() {
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<Record<string, string>>({});

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
      const data = await adminRequest<AboutPayload>('/api/admin/about');
      setSections(data?.sections && typeof data.sections === 'object' ? { ...data.sections } : {});
    } catch {
      showToast('Failed to load about content.', 'error');
      setSections({});
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

  const keys = Object.keys(sections).sort((a, b) => a.localeCompare(b));

  const setSection = (k: string, v: string) => {
    setSections((prev) => ({ ...prev, [k]: v }));
  };

  const addSection = () => {
    const base = 'section';
    let k = base;
    let n = 1;
    while (k in sections) {
      k = `${base}_${n++}`;
    }
    setSections((prev) => ({ ...prev, [k]: '' }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminRequest('/api/admin/about', {
        method: 'PUT',
        body: JSON.stringify({ sections }),
      });
      showToast('About content saved.', 'success');
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
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">About MAMSA</h1>
          <p className="mt-1 text-sm text-gray-500">Each section key maps to one row in the about table.</p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {keys.length === 0 ? (
              <p className="text-sm text-gray-500">No sections yet. Add one to start.</p>
            ) : (
              keys.map((k) => (
                <label key={k} className="block text-sm font-medium text-gray-700">
                  Section: <span className="font-mono text-emerald-700">{k}</span>
                  <textarea className={taClass} value={sections[k] ?? ''} onChange={(e) => setSection(k, e.target.value)} />
                </label>
              ))
            )}
            <button type="button" onClick={addSection} className="text-sm font-semibold text-emerald-600 hover:underline">
              + Add section
            </button>
            <div className="border-t border-gray-100 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
