'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AdminLayout from '@/components/AdminLayout';
import AlumniModal, { AlumniFormValues, AlumniRecord } from '@/components/AlumniModal';
import ConfirmModal from '@/components/ConfirmModal';

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
  const [alumni, setAlumni] = useState<AlumniRecord[]>([]);
  const [alumniLoading, setAlumniLoading] = useState(true);
  const [isAlumniModalOpen, setIsAlumniModalOpen] = useState(false);
  const [editingAlumnus, setEditingAlumnus] = useState<AlumniRecord | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alumnusToDelete, setAlumnusToDelete] = useState<AlumniRecord | null>(null);

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

  const loadAlumni = useCallback(async () => {
    try {
      setAlumniLoading(true);
      const { data, error } = await supabase
        .from('notable_alumni')
        .select(
          'id, full_name, slug, graduation_year, biography, achievements, current_position, organization, specialty, image_url, profile_links, featured, status, order_position, created_at'
        )
        .order('order_position', { ascending: true, nullsFirst: true })
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setAlumni((data as AlumniRecord[]) ?? []);
    } catch (err) {
      console.error('Failed to load notable alumni:', err);
      showToast('error', 'Failed to load notable alumni.');
    } finally {
      setAlumniLoading(false);
    }
  }, [showToast, supabase]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user) return;
    loadContent();
    loadAlumni();
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

    const alumniChannel = supabase
      .channel('notable_alumni_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notable_alumni',
        },
        () => {
          loadAlumni();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(alumniChannel);
    };
  }, [loadAlumni, loadContent, supabase, user]);

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

  const handleSaveAlumnus = async (values: AlumniFormValues) => {
    const payload = {
      full_name: values.full_name.trim(),
      slug: values.slug.trim() || null,
      graduation_year: values.graduation_year ? Number(values.graduation_year) : null,
      biography: values.biography.trim(),
      achievements: values.achievements.trim() || null,
      current_position: values.current_position.trim() || null,
      organization: values.organization.trim() || null,
      specialty: values.specialty.trim() || null,
      image_url: values.image_url.trim() || null,
      profile_links: {
        linkedin: values.linkedin.trim() || null,
        twitter: values.twitter.trim() || null,
        website: values.website.trim() || null,
      },
      featured: values.featured,
      status: values.status,
      order_position: Number.isFinite(values.order_position) ? values.order_position : 0,
    };

    try {
      if (editingAlumnus) {
        const { error } = await supabase
          .from('notable_alumni')
          .update(payload)
          .eq('id', editingAlumnus.id);

        if (error) {
          throw error;
        }

        showToast('success', 'Notable alumni details updated.');
      } else {
        const { error } = await supabase.from('notable_alumni').insert(payload);

        if (error) {
          throw error;
        }

        showToast('success', 'Notable alumni added.');
      }

      await loadAlumni();
      setEditingAlumnus(null);
    } catch (err) {
      console.error('Failed to save notable alumni:', err);
      showToast('error', 'Failed to save notable alumni. Please try again.');
      throw err;
    }
  };

  const handleDeleteAlumnus = async () => {
    if (!alumnusToDelete) return;

    try {
      const { error } = await supabase.from('notable_alumni').delete().eq('id', alumnusToDelete.id);
      if (error) {
        throw error;
      }
      showToast('success', 'Notable alumni removed.');
      setShowDeleteModal(false);
      setAlumnusToDelete(null);
      await loadAlumni();
    } catch (err) {
      console.error('Failed to delete notable alumni:', err);
      showToast('error', 'Failed to delete notable alumni. Please try again.');
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

        <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-gray-100 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Notable Alumni</h2>
              <p className="mt-1 text-sm text-gray-600">
                Highlight inspiring graduates and their lasting impact on the MAMSA community.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingAlumnus(null);
                setIsAlumniModalOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
              </svg>
              Add Alumni
            </button>
          </header>
          <div className="px-6 py-6">
            {alumniLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center text-gray-600">
                  <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  <p className="text-sm font-medium">Loading notable alumni…</p>
                </div>
              </div>
            ) : alumni.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
                <h3 className="text-lg font-semibold text-gray-800">No notable alumni yet</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Create the first alumni profile to celebrate the community’s legacy.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAlumnus(null);
                    setIsAlumniModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-600 transition hover:border-emerald-400 hover:text-emerald-700"
                >
                  Create alumni profile
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {alumni.map((alumnus) => {
                  const statusClasses =
                    alumnus.status === 'published'
                      ? 'bg-emerald-50 text-emerald-700'
                      : alumnus.status === 'archived'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-600';

                  return (
                    <article
                      key={alumnus.id}
                      className="flex flex-col gap-6 rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg md:flex-row md:items-start"
                    >
                      <div className="flex w-full flex-none items-start gap-4 md:w-2/5">
                        <div className="relative h-20 w-20 flex-none overflow-hidden rounded-xl bg-emerald-50">
                          {alumnus.image_url ? (
                            <Image
                              src={alumnus.image_url}
                              alt={alumnus.full_name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-emerald-600">
                              {alumnus.full_name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">{alumnus.full_name}</h3>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses}`}>
                              {alumnus.status === 'published'
                                ? 'Published'
                                : alumnus.status === 'archived'
                                  ? 'Archived'
                                  : 'Draft'}
                            </span>
                            {alumnus.featured && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {alumnus.current_position && alumnus.organization
                              ? `${alumnus.current_position} • ${alumnus.organization}`
                              : alumnus.current_position || alumnus.organization || 'Role information pending'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            {alumnus.graduation_year && <span>Class of {alumnus.graduation_year}</span>}
                            {alumnus.specialty && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                                <svg className="h-3 w-3 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2h-2V5H4v10h4v2H4a2 2 0 01-2-2V5z" />
                                  <path d="M14 10h4l-5 5-5-5h4V4h2v6z" />
                                </svg>
                                {alumnus.specialty}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 space-y-3 text-sm text-gray-600">
                        <p className="line-clamp-4">{alumnus.biography || 'Biography coming soon.'}</p>
                        {alumnus.achievements && (
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700">
                            <p className="text-xs font-semibold uppercase tracking-wide">Highlights</p>
                            <p className="mt-1 text-sm">{alumnus.achievements}</p>
                          </div>
                        )}
                        {alumnus.profile_links && (
                          <div className="flex flex-wrap gap-3 text-xs font-medium text-emerald-600">
                            {alumnus.profile_links.linkedin && (
                              <a
                                href={alumnus.profile_links.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 hover:text-emerald-700"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.24 23.5h4.52V7.98H.24V23.5zM7.5 7.98h4.33v2.12h.06c.6-1.14 2.08-2.35 4.28-2.35 4.58 0 5.43 3.02 5.43 6.94V23.5h-4.52v-7.4c0-1.76-.03-4.02-2.45-4.02-2.45 0-2.83 1.9-2.83 3.89v7.53H7.5V7.98z" />
                                </svg>
                                LinkedIn
                              </a>
                            )}
                            {alumnus.profile_links.twitter && (
                              <a
                                href={alumnus.profile_links.twitter}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 hover:text-emerald-700"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19.633 7.997c.013.176.013.353.013.53 0 5.388-4.1 11.604-11.604 11.604-2.303 0-4.44-.668-6.24-1.825.324.038.636.051.972.051a8.2 8.2 0 005.088-1.752 4.106 4.106 0 01-3.834-2.85c.255.038.51.064.778.064.372 0 .743-.051 1.09-.14a4.097 4.097 0 01-3.29-4.016v-.051c.54.3 1.165.485 1.83.51A4.093 4.093 0 012.82 6.47c0-.761.204-1.456.56-2.064a11.65 11.65 0 008.457 4.287 4.62 4.62 0 01-.102-.94 4.094 4.094 0 017.086-2.8 8.084 8.084 0 002.598-.99 4.085 4.085 0 01-1.8 2.264 8.19 8.19 0 002.358-.64 8.8 8.8 0 01-2.06 2.135z" />
                                </svg>
                                Twitter
                              </a>
                            )}
                            {alumnus.profile_links.website && (
                              <a
                                href={alumnus.profile_links.website}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 hover:text-emerald-700"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 17.93V19a1 1 0 10-2 0v.93A8.001 8.001 0 014.07 13H5a1 1 0 100-2h-.93A8.001 8.001 0 0111 4.07V5a1 1 0 102 0v-.93A8.001 8.001 0 0119.93 11H19a1 1 0 100 2h.93A8.001 8.001 0 0113 19.93z" />
                                </svg>
                                Website
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-none flex-col gap-3 md:w-40">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAlumnus(alumnus);
                            setIsAlumniModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-600 transition hover:border-emerald-400 hover:text-emerald-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAlumnusToDelete(alumnus);
                            setShowDeleteModal(true);
                          }}
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:border-red-400 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {lastUpdatedDisplay && (
          <p className="text-sm text-gray-500">
            Last updated <span className="font-medium text-gray-700">{lastUpdatedDisplay}</span>
          </p>
        )}
      </div>

      <AlumniModal
        isOpen={isAlumniModalOpen}
        onClose={() => {
          setIsAlumniModalOpen(false);
          setEditingAlumnus(null);
        }}
        onSave={handleSaveAlumnus}
        editingItem={editingAlumnus}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAlumnusToDelete(null);
        }}
        onConfirm={handleDeleteAlumnus}
        title="Delete Alumni Profile"
        message={`Are you sure you want to delete "${alumnusToDelete?.full_name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </AdminLayout>
  );
}

