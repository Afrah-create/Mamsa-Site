'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AdminLayout from '@/components/AdminLayout';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'archived';
  admin_notes: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ContactSettings {
  id: number;
  office_name: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  map_embed_url: string | null;
  updated_at: string;
}

type ToastState = { type: 'success' | 'error'; message: string } | null;

const STATUS_OPTIONS: Array<{
  value: ContactMessage['status'];
  label: string;
  description: string;
}> = [
  { value: 'new', label: 'New', description: 'Awaiting review' },
  { value: 'in_progress', label: 'In progress', description: 'Being handled' },
  { value: 'resolved', label: 'Resolved', description: 'Response sent' },
  { value: 'archived', label: 'Archived', description: 'Closed and filed away' },
];

const statusBadgeStyles: Record<ContactMessage['status'], string> = {
  new: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  in_progress: 'bg-blue-100 text-blue-700 border border-blue-200',
  resolved: 'bg-gray-100 text-gray-700 border border-gray-200',
  archived: 'bg-slate-100 text-slate-500 border border-slate-200',
};

const statusDotStyles: Record<ContactMessage['status'], string> = {
  new: 'bg-emerald-500',
  in_progress: 'bg-blue-500',
  resolved: 'bg-gray-500',
  archived: 'bg-slate-400',
};


const emptyContactSettings: ContactSettings = {
  id: 0,
  office_name: '',
  address: '',
  email: '',
  phone: '',
  latitude: null,
  longitude: null,
  map_embed_url: null,
  updated_at: new Date().toISOString(),
};

function ContactManagementContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ContactMessage['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<ToastState>(null);
  const [settings, setSettings] = useState<ContactSettings>(emptyContactSettings);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const supabase = createClient();

  const filteredMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return messages.filter((message) => {
      const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
      if (!matchesStatus) return false;

      if (!query) return true;

      return (
        message.name.toLowerCase().includes(query) ||
        message.email.toLowerCase().includes(query) ||
        (message.phone ?? '').toLowerCase().includes(query) ||
        message.subject.toLowerCase().includes(query) ||
        message.message.toLowerCase().includes(query)
      );
    });
  }, [messages, statusFilter, searchQuery]);

  const selectedMessage = useMemo(
    () => filteredMessages.find((message) => message.id === selectedMessageId) ?? filteredMessages[0] ?? null,
    [filteredMessages, selectedMessageId]
  );

  const summary = useMemo(() => {
    return messages.reduce(
      (acc, message) => {
        acc.total += 1;
        acc[message.status] += 1;
        return acc;
      },
      { total: 0, new: 0, in_progress: 0, resolved: 0, archived: 0 }
    );
  }, [messages]);

  const showToast = useCallback((input: ToastState) => {
    setToast(input);
    if (input) {
      setTimeout(() => setToast(null), 4000);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        window.location.href = '/login';
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (adminError || !admin) {
        window.location.href = '/login';
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error('Contact management auth error:', error);
      window.location.href = '/login';
    } finally {
      setLoadingUser(false);
    }
  }, [supabase]);

  const loadMessages = useCallback(async () => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load contact messages:', error);
        showToast({ type: 'error', message: 'Unable to fetch contact messages.' });
        return;
      }

      setMessages(data ?? []);
    } catch (error) {
      console.error('Unexpected contact message load error:', error);
      showToast({ type: 'error', message: 'Unexpected error loading messages.' });
    } finally {
      setLoadingMessages(false);
    }
  }, [supabase, showToast]);

  const loadSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const { data, error } = await supabase
        .from('contact_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Failed to load contact settings:', error);
        showToast({ type: 'error', message: 'Unable to load contact settings.' });
        return;
      }

      if (data) {
        setSettings({
          ...emptyContactSettings,
          ...data,
          map_embed_url: data.map_embed_url?.trim() || null,
        });
      } else {
        setSettings(emptyContactSettings);
      }
    } catch (error) {
      console.error('Unexpected contact settings load error:', error);
      showToast({ type: 'error', message: 'Unexpected error loading contact settings.' });
    } finally {
      setLoadingSettings(false);
    }
  }, [supabase, showToast]);

  const handleSelectMessage = useCallback(
    async (message: ContactMessage) => {
      setSelectedMessageId(message.id);

      if (message.status === 'new') {
        try {
          const { data, error } = await supabase
            .from('contact_messages')
            .update({ status: 'in_progress' })
            .eq('id', message.id)
            .select()
            .single();

          if (error) {
            console.error('Failed to update message status when opening:', error);
            return;
          }

          setMessages((prev) => prev.map((item) => (item.id === message.id ? data : item)));
        } catch (error) {
          console.error('Unexpected status update on select:', error);
        }
      }
    },
    [supabase]
  );

  const updateMessage = useCallback(
    async (id: number, updates: Partial<ContactMessage>) => {
      try {
        const { data, error } = await supabase
          .from('contact_messages')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Failed to update contact message:', error);
          showToast({ type: 'error', message: 'Unable to update the message.' });
          return;
        }

        setMessages((prev) => prev.map((item) => (item.id === id ? data : item)));
        if (selectedMessageId === id) {
          setSelectedMessageId(id);
        }
        showToast({ type: 'success', message: 'Update saved.' });
      } catch (error) {
        console.error('Unexpected error updating message:', error);
        showToast({ type: 'error', message: 'Unexpected error saving changes.' });
      }
    },
    [supabase, selectedMessageId, showToast]
  );

  const handleStatusChange = useCallback(
    async (id: number, status: ContactMessage['status']) => {
      const responded_at = status === 'resolved' ? new Date().toISOString() : null;
      await updateMessage(id, { status, responded_at });
    },
    [updateMessage]
  );

  const handleNoteSave = useCallback(
    async (id: number, note: string) => {
      await updateMessage(id, { admin_notes: note });
    },
    [updateMessage]
  );

  const handleMarkAsRead = useCallback(
    async (id: number) => {
      const message = messages.find((m) => m.id === id);
      if (message && message.status === 'new') {
        await handleStatusChange(id, 'in_progress');
      }
    },
    [messages, handleStatusChange]
  );

  const handleDeleteMessage = useCallback(
    async (id: number) => {
      if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
        return;
      }

      try {
        const { error } = await supabase.from('contact_messages').delete().eq('id', id);

        if (error) {
          console.error('Failed to delete message:', error);
          showToast({ type: 'error', message: 'Failed to delete message.' });
          return;
        }

        setMessages((prev) => prev.filter((item) => item.id !== id));
        if (selectedMessageId === id) {
          setSelectedMessageId(null);
        }
        showToast({ type: 'success', message: 'Message deleted successfully.' });
      } catch (error) {
        console.error('Unexpected error deleting message:', error);
        showToast({ type: 'error', message: 'Unexpected error deleting message.' });
      }
    },
    [supabase, selectedMessageId, showToast]
  );

  const handleSettingsSave = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!settings) return;

      try {
        setSavingSettings(true);
        const payload = {
          office_name: settings.office_name || null,
          address: settings.address || null,
          email: settings.email || null,
          phone: settings.phone || null,
          latitude: settings.latitude,
          longitude: settings.longitude,
          map_embed_url: settings.map_embed_url?.trim() || null,
          updated_by: user?.id ?? null,
        };

        if (settings.id) {
          const { data, error } = await supabase
            .from('contact_settings')
            .update(payload)
            .eq('id', settings.id)
            .select()
            .single();

          if (error) {
            console.error('Failed to update contact settings:', error);
            showToast({ type: 'error', message: 'Unable to update contact settings.' });
            return;
          }

          setSettings(data);
        } else {
          const { data, error } = await supabase
            .from('contact_settings')
            .insert(payload)
            .select()
            .single();

          if (error) {
            console.error('Failed to create contact settings:', error);
            showToast({ type: 'error', message: 'Unable to save contact settings.' });
            return;
          }

          setSettings(data);
        }

        showToast({ type: 'success', message: 'Contact settings updated.' });
      } catch (error) {
        console.error('Unexpected error saving contact settings:', error);
        showToast({ type: 'error', message: 'Unexpected error saving settings.' });
      } finally {
        setSavingSettings(false);
      }
    },
    [settings, supabase, user?.id, showToast]
  );

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user) return;
    loadMessages();
    loadSettings();
  }, [user, loadMessages, loadSettings]);

  // Handle message ID from URL query parameter (from notification drawer)
  useEffect(() => {
    const messageIdParam = searchParams.get('message');
    if (messageIdParam && messages.length > 0) {
      const messageId = parseInt(messageIdParam, 10);
      const message = messages.find((m) => m.id === messageId);
      if (message) {
        handleSelectMessage(message);
        // Clean up URL
        window.history.replaceState({}, '', '/contact-management');
      }
    }
  }, [searchParams, messages, handleSelectMessage]);

  useEffect(() => {
    const channel = supabase
      .channel('contact_management_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_messages',
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, loadMessages]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center text-gray-600">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="font-medium">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Inbox</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor inbound enquiries, respond to members, and keep your office details up to date.
          </p>
        </div>

        {toast && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm shadow-sm ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {toast.message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'New',
              value: summary.new,
              caption: 'Awaiting review',
            },
            {
              label: 'In progress',
              value: summary.in_progress,
              caption: 'Being handled',
            },
            {
              label: 'Resolved',
              value: summary.resolved,
              caption: 'Completed responses',
            },
            {
              label: 'All messages',
              value: summary.total,
              caption: 'Total submissions',
            },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{card.value}</p>
              <p className="mt-1 text-xs text-gray-500">{card.caption}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.8fr,1fr]">
          <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {(['all', 'new', 'in_progress', 'resolved', 'archived'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        statusFilter === status
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:border-emerald-200 hover:text-emerald-700'
                      }`}
                    >
                      <span
                        className={`mr-2 h-1.5 w-1.5 rounded-full ${
                          status === 'all' ? 'bg-gray-300' : statusDotStyles[status as ContactMessage['status']]
                        }`}
                      />
                      {status === 'all'
                        ? `All (${summary.total})`
                        : `${STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status} (${
                            summary[status as ContactMessage['status']]
                          })`}
                    </button>
                  ))}
                </div>
                <div className="w-full max-w-xs">
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search by name, subject, or email"
                      className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="max-h-[540px] overflow-y-auto divide-y divide-gray-100">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12 text-sm text-gray-500">
                  Loading messages…
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">No messages found</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Try adjusting your filters or check back when new enquiries arrive.
                    </p>
                  </div>
                </div>
              ) : (
                filteredMessages.map((message) => {
                  const isSelected = selectedMessage?.id === message.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex w-full items-start gap-3 px-4 py-4 transition hover:bg-gray-50 sm:px-6 ${
                        isSelected ? 'bg-emerald-50/60' : ''
                      }`}
                    >
                      <button
                        onClick={() => handleSelectMessage(message)}
                        className="flex-1 flex items-start gap-3 text-left"
                      >
                        <div className="relative mt-0.5 flex-shrink-0">
                          <div className={`h-2 w-2 rounded-full ${statusDotStyles[message.status]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{message.subject}</p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                {message.name} · {message.email}
                              </p>
                            </div>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeStyles[message.status]}`}
                            >
                              {STATUS_OPTIONS.find((option) => option.value === message.status)?.label ?? message.status}
                            </span>
                          </div>
                          <p className="mt-3 line-clamp-2 text-sm text-gray-600">{message.message}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                            <span>
                              Received{' '}
                              {new Date(message.created_at).toLocaleString(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                            {message.phone && <span>Phone: {message.phone}</span>}
                            {message.admin_notes && <span className="italic text-gray-500">Note added</span>}
                          </div>
                        </div>
                      </button>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {message.status === 'new' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(message.id);
                            }}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                            title="Mark as read"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(message.id);
                          }}
                          className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
                          title="Delete message"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <aside className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            {selectedMessage ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedMessage.name}</p>
                      <p className="text-xs text-gray-500">{selectedMessage.email}</p>
                      {selectedMessage.phone && (
                        <p className="text-xs text-gray-500">Phone: {selectedMessage.phone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedMessage.status === 'new' && (
                        <button
                          onClick={() => handleMarkAsRead(selectedMessage.id)}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                          title="Mark as read"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMessage(selectedMessage.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
                        title="Delete message"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setSelectedMessageId(null)}
                        className="hidden rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 transition hover:border-emerald-200 hover:text-emerald-700 xl:block"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <label className="text-xs font-medium text-gray-500">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStatusChange(selectedMessage.id, option.value)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition border ${
                            selectedMessage.status === option.value
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 text-gray-600 hover:border-emerald-200 hover:text-emerald-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 shadow-inner">
                    <p className="whitespace-pre-line leading-relaxed">{selectedMessage.message}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>
                        Last updated{' '}
                        {new Date(selectedMessage.updated_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      {selectedMessage.responded_at && (
                        <span>
                          Responded{' '}
                          {new Date(selectedMessage.responded_at).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500">Admin notes</label>
                    <textarea
                      defaultValue={selectedMessage.admin_notes ?? ''}
                      onBlur={(event) => {
                        const value = event.target.value.trim();
                        if (value !== (selectedMessage.admin_notes ?? '')) {
                          handleNoteSave(selectedMessage.id, value);
                        }
                      }}
                      placeholder="Add internal notes to coordinate with other administrators…"
                      className="mt-2 h-32 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Notes are visible only to administrators. Click outside the textarea to save.
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <a
                      className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
                      href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(selectedMessage.subject)}`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12H8m8 0a4 4 0 10-8 0 4 4 0 008 0z" />
                      </svg>
                      Reply via email
                    </a>
                    {selectedMessage.phone && (
                      <a
                        className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
                        href={`tel:${selectedMessage.phone}`}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h1.28a1 1 0 01.948.684l1.122 3.368a1 1 0 01-.502 1.214l-1.084.542a11.042 11.042 0 006.012 6.012l.542-1.084a1 1 0 011.214-.502l3.368 1.122a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.82 21 3 14.18 3 5z" />
                        </svg>
                        Call {selectedMessage.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Select a message to view details</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose a message to update its status, leave notes, or follow up with the sender.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>

        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              <p className="text-sm text-gray-600">
                Update the office details shown on the public contact page and used in email notifications.
              </p>
            </div>
          </div>

          <form onSubmit={handleSettingsSave} className="space-y-6 px-4 py-6 sm:px-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Office name</label>
                <input
                  value={settings.office_name ?? ''}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      office_name: event.target.value,
                    }))
                  }
                  placeholder="MAMSA Headquarters"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Support email</label>
                <input
                  type="email"
                  value={settings.email ?? ''}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  placeholder="info@mamsa.org"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <input
                  value={settings.phone ?? ''}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="+1 (555) 123-4567"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Office address</label>
                <input
                  value={settings.address ?? ''}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      address: event.target.value,
                    }))
                  }
                  placeholder="123 Medical Avenue, Suite 400"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>


            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={settings.latitude ?? ''}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      latitude: event.target.value === '' ? null : Number(event.target.value),
                    }))
                  }
                  placeholder="0"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={settings.longitude ?? ''}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      longitude: event.target.value === '' ? null : Number(event.target.value),
                    }))
                  }
                  placeholder="0"
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
              <span>
                Last updated{' '}
                {loadingSettings
                  ? '…'
                  : settings.updated_at
                  ? new Date(settings.updated_at).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Not set'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={loadSettings}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-emerald-200 hover:text-emerald-700"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
              >
                {savingSettings ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminLayout>
  );
}

export default function ContactManagementPage() {
  return (
    <Suspense fallback={
      <AdminLayout user={null}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Loading contact management...</p>
          </div>
        </div>
      </AdminLayout>
    }>
      <ContactManagementContent />
    </Suspense>
  );
}


