'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AdminLayout from '@/components/AdminLayout';

type AboutSectionKey = 'history' | 'mission' | 'vision' | 'values' | 'objectives';

interface AboutSection {
  key: AboutSectionKey;
  title: string;
  placeholder: string;
}

type AboutFormState = Record<AboutSectionKey, string>;

type AboutRow = {
  id: number;
  section: string;
  content: string;
  updated_at: string | null;
};

const sections: AboutSection[] = [
  {
    key: 'history',
    title: 'History',
    placeholder: 'Describe the association’s background, founding story, and notable milestones…',
  },
  {
    key: 'mission',
    title: 'Mission',
    placeholder: 'Define the purpose and what the association aims to achieve in the short term…',
  },
  {
    key: 'vision',
    title: 'Vision',
    placeholder: 'Share the long-term vision that guides the association forward…',
  },
  {
    key: 'values',
    title: 'Core Values',
    placeholder: 'List the core values or guiding principles that shape the association…',
  },
  {
    key: 'objectives',
    title: 'Strategic Objectives',
    placeholder: 'Outline the current strategic objectives or focus areas…',
  },
];

const EMPTY_FORM: AboutFormState = {
  history: '',
  mission: '',
  vision: '',
  values: '',
  objectives: '',
};

export default function AboutPage() {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<AboutFormState>(EMPTY_FORM);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const supabase = createClient();

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !authUser) {
        window.location.href = '/login';
        return;
      }

      const { error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (adminError) {
        window.location.href = '/login';
        return;
      }

      setUser(authUser);
    } catch (err) {
      console.error('Auth check failed:', err);
      window.location.href = '/login';
    }
  }, [supabase]);

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('about')
        .select('id, section, content, updated_at');

      if (error) {
        throw error;
      }

      if (data) {
        const draft: AboutFormState = { ...EMPTY_FORM };
        let latest: string | null = null;

        (data as AboutRow[]).forEach((row) => {
          const key = row.section as AboutSectionKey;
          if (key in draft) {
            draft[key] = row.content;
            if (row.updated_at && (!latest || new Date(row.updated_at) > new Date(latest))) {
              latest = row.updated_at;
            }
          }
        });

        setFormData(draft);
        setLastUpdated(latest);
      } else {
        setFormData(EMPTY_FORM);
        setLastUpdated(null);
      }
    } catch (err) {
      console.error('Failed to load about content:', err);
      showToast('error', 'Failed to load about content.');
    } finally {
      setLoading(false);
    }
  }, [showToast, supabase]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user) return;
    loadContent();
    const channel = supabase
      .channel('about_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'about',
        },
        (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE' }) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            loadContent();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadContent, supabase, user]);

  const handleFieldChange = (key: AboutSectionKey, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const rows = sections.map((section) => ({
        section: section.key,
        content: formData[section.key].trim(),
      }));

      const { error } = await supabase
        .from('about')
        .upsert(rows, { onConflict: 'section' });

      if (error) {
        throw error;
      }

      showToast('success', 'About content saved successfully.');
      await loadContent();
    } catch (err) {
      console.error('Failed to save about content:', err);
      showToast('error', 'Failed to save about content.');
    } finally {
      setSaving(false);
    }
  };

  const lastUpdatedDisplay = useMemo(() => {
    if (!lastUpdated) return null;
    return new Date(lastUpdated).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [lastUpdated]);

  if (!user || loading) {
    return (
      <AdminLayout user={user}>
        <div className="flex h-full items-center justify-center py-16">
          <div className="text-center text-gray-600">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="font-medium">Loading about content…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user}>
      <div className="w-full space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">About MAMSA</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage the official story, mission, and core principles of the association.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadContent}
              className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-emerald-500 hover:text-emerald-600"
              disabled={saving}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {toast && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {toast.message}
          </div>
        )}

        <div className="grid gap-6">
          {sections.map((section) => (
            <section key={section.key} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <header className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                  <p className="text-sm text-gray-500">Update the official {section.key} statement.</p>
                </div>
              </header>
              <div className="px-4 py-4">
                <textarea
                  className="h-40 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 shadow-inner transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 md:h-48"
                  value={formData[section.key]}
                  onChange={(event) => handleFieldChange(section.key, event.target.value)}
                  placeholder={section.placeholder}
                />
              </div>
            </section>
          ))}
        </div>

        {lastUpdatedDisplay && (
          <p className="text-sm text-gray-500">
            Last updated <span className="font-medium text-gray-700">{lastUpdatedDisplay}</span>
          </p>
        )}
      </div>
    </AdminLayout>
  );
}

