'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import Toast from '@/components/Toast';
import { adminRequest } from '@/lib/admin-api';
import { requireAuth, type SessionUser } from '@/lib/session-manager';
import { resolveImageSrc } from '@/lib/image-utils';
import { optimizeImageForUpload } from '@/lib/image-client';
import { useAdminProfile, type AdminHeaderProfile } from '@/context/AdminProfileContext';

type FieldErrors = Partial<
  Record<'full_name' | 'email' | 'current_password' | 'new_password' | 'confirm_password' | '_form', string>
>;

function ProfileLoadingShell() {
  return (
    <div className="w-full space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-full max-w-md animate-pulse rounded bg-gray-100" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mx-auto h-24 w-24 animate-pulse rounded-full bg-gray-200" />
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="space-y-4">
            <div className="h-10 animate-pulse rounded bg-gray-200" />
            <div className="h-10 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminProfileFormBody({ user }: { user: SessionUser }) {
  const { setProfile, refreshProfile, refreshSession } = useAdminProfile();

  const [profile, setLocalProfile] = useState<AdminHeaderProfile | null>(null);
  const [loadingForm, setLoadingForm] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [pendingAvatarBase64, setPendingAvatarBase64] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const loadForm = useCallback(async () => {
    setLoadingForm(true);
    setFieldErrors({});
    try {
      const data = await adminRequest<AdminHeaderProfile | null>('/api/admin/profile');
      if (!data) {
        setFieldErrors({ _form: 'Profile not found.' });
        return;
      }
      setLocalProfile(data);
      setFullName(data.full_name ?? '');
      setEmail(data.email ?? '');
    } catch (e) {
      setFieldErrors({
        _form: e instanceof Error ? e.message : 'Failed to load profile',
      });
    } finally {
      setLoadingForm(false);
    }
  }, []);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  const displayAvatarSrc =
    pendingAvatarBase64 ??
    (profile?.avatar_url ? resolveImageSrc(profile.avatar_url) : '');

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFieldErrors((prev) => ({ ...prev, _form: 'Please select an image file.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, _form: 'Image must be 5MB or smaller.' }));
      return;
    }
    try {
      const base64 = await optimizeImageForUpload(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
      });
      setPendingAvatarBase64(base64);
      setFieldErrors((prev) => ({ ...prev, _form: undefined }));
    } catch {
      setFieldErrors((prev) => ({ ...prev, _form: 'Could not read the image file.' }));
    }
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!fullName.trim()) next.full_name = 'Full name is required.';
    if (!email.trim()) next.email = 'Email is required.';
    const np = newPassword.trim();
    if (np) {
      if (np.length < 8) next.new_password = 'Password must be at least 8 characters.';
      if (np !== confirmPassword) next.confirm_password = 'Passwords do not match.';
      if (!currentPassword) next.current_password = 'Enter your current password to set a new one.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setFieldErrors({});
    try {
      const np = newPassword.trim();
      const body: Record<string, string | undefined> = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
      };
      if (np) {
        body.current_password = currentPassword;
        body.new_password = np;
      }
      if (pendingAvatarBase64) {
        body.avatar = pendingAvatarBase64;
      }

      const updated = await adminRequest<AdminHeaderProfile>('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      setLocalProfile(updated);
      setProfile(updated);
      await refreshProfile();
      await refreshSession();

      setToast({ message: 'Profile updated successfully', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPendingAvatarBase64(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      setFieldErrors({ _form: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loadingForm) {
    return <ProfileLoadingShell />;
  }

  const roleLabel = profile?.role?.replace(/_/g, ' ') ?? user.role.replace(/_/g, ' ');
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <>
      <Toast
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        isVisible={Boolean(toast)}
        onClose={() => setToast(null)}
      />

      <div className="w-full space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-gray-600">Update your account details and password.</p>
        </div>

        {fieldErrors._form && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{fieldErrors._form}</div>
        )}

        <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Photo & role</h2>
            <div className="flex flex-col items-center text-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-green-500 to-green-700 shadow-inner ring-2 ring-green-100">
                {displayAvatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayAvatarSrc}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(ev) => {
                      (ev.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white">
                    {(fullName || user.email || 'A').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <label className="mt-4 inline-flex cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
                <span className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2">
                  Change Photo
                </span>
              </label>
              <p className="mt-2 text-xs text-gray-500">JPG, PNG, or WebP. Max 5MB. Saved when you click Save Changes.</p>

              <span className="mt-4 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold capitalize text-green-800">
                {roleLabel}
              </span>
              <p className="mt-2 text-xs text-gray-500">
                Member since <span className="font-medium text-gray-700">{memberSince}</span>
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Details</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoComplete="name"
                />
                {fieldErrors.full_name && <p className="mt-1 text-xs text-red-600">{fieldErrors.full_name}</p>}
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoComplete="email"
                />
                {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
              </div>
            </div>

            <div className="my-6 border-t border-gray-200" />

            <h3 className="text-sm font-semibold text-gray-900">Change password</h3>
            <p className="mt-1 text-xs text-gray-500">Leave new password blank to keep your current password.</p>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                  Current password
                </label>
                <div className="relative mt-1">
                  <input
                    id="current_password"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                    onClick={() => setShowCurrent((v) => !v)}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.current_password && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.current_password}</p>
                )}
              </div>
              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                  New password
                </label>
                <div className="relative mt-1">
                  <input
                    id="new_password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showNew ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                    onClick={() => setShowNew((v) => !v)}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.new_password && <p className="mt-1 text-xs text-red-600">{fieldErrors.new_password}</p>}
              </div>
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                  Confirm new password
                </label>
                <div className="relative mt-1">
                  <input
                    id="confirm_password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm text-gray-900 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirm_password && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.confirm_password}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md border border-transparent bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

export default function AdminProfileSettingsClient() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await requireAuth();
        if (!session || cancelled) return;
        setUser(session.user);
      } catch {
        if (!cancelled) window.location.href = '/login';
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminLayout user={user}>
      {booting || !user ? <ProfileLoadingShell /> : <AdminProfileFormBody user={user} />}
    </AdminLayout>
  );
}
