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

const SOCIAL_KEYS = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'] as const;

type ContactRow = {
  id?: number;
  phone: string | null;
  email: string | null;
  address: string | null;
  office_hours: string | null;
  social_media: unknown;
};

function parseSocial(raw: unknown): Record<string, string> {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      const o = JSON.parse(raw) as unknown;
      return typeof o === 'object' && o !== null && !Array.isArray(o) ? (o as Record<string, string>) : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...(raw as Record<string, string>) };
  }
  return {};
}

export default function AdminSiteContactPageClient() {
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [officeHours, setOfficeHours] = useState('');
  const [social, setSocial] = useState<Record<string, string>>({});

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
      const row = await adminRequest<ContactRow | null>('/api/admin/contact');
      setPhone(row?.phone ?? '');
      setEmail(row?.email ?? '');
      setAddress(row?.address ?? '');
      setOfficeHours(row?.office_hours ?? '');
      const s = parseSocial(row?.social_media);
      const next: Record<string, string> = {};
      for (const k of SOCIAL_KEYS) {
        next[k] = s[k] ?? '';
      }
      setSocial(next);
    } catch {
      showToast('Failed to load contact info.', 'error');
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const social_media: Record<string, string> = {};
    for (const k of SOCIAL_KEYS) {
      const v = (social[k] ?? '').trim();
      if (v) social_media[k] = v;
    }
    setSaving(true);
    try {
      await adminRequest('/api/admin/contact', {
        method: 'PUT',
        body: JSON.stringify({
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          office_hours: officeHours.trim() || null,
          social_media,
        }),
      });
      showToast('Contact details saved.', 'success');
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
          <h1 className="text-2xl font-bold text-gray-900">Site contact</h1>
          <p className="mt-1 text-sm text-gray-500">Public address, phone, email, and social links. Inbox messages live under Contact Inbox.</p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-medium text-gray-700">
              Phone
              <input className={`${inputClass} mt-1`} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Email
              <input type="email" className={`${inputClass} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Address
              <textarea className={`${inputClass} mt-1 min-h-[80px]`} value={address} onChange={(e) => setAddress(e.target.value)} />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Office hours
              <textarea className={`${inputClass} mt-1 min-h-[60px]`} value={officeHours} onChange={(e) => setOfficeHours(e.target.value)} />
            </label>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Social media</h2>
              <div className="mt-3 space-y-3">
                {SOCIAL_KEYS.map((k) => (
                  <label key={k} className="block text-sm font-medium capitalize text-gray-700">
                    {k}
                    <input
                      className={`${inputClass} mt-1`}
                      placeholder="URL"
                      value={social[k] ?? ''}
                      onChange={(e) => setSocial((prev) => ({ ...prev, [k]: e.target.value }))}
                    />
                  </label>
                ))}
              </div>
            </div>
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
