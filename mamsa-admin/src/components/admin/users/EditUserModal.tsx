'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { adminRequest } from '@/lib/admin-api';
import { optimizeImageForUpload } from '@/lib/image-client';
import { resolveImageSrc } from '@/lib/image-utils';
import type { AdminRole, AdminStatus, AdminUser } from '@/types/admin-user';

type Props = {
  isOpen: boolean;
  item: AdminUser | null;
  onClose: () => void;
  onSuccess: (meta: { fullName: string }) => void;
};

const inputClass =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500';

const ROLES: AdminRole[] = ['super_admin', 'admin', 'moderator'];
const STATUSES: AdminStatus[] = ['active', 'inactive', 'suspended'];

type FieldKey = 'full_name' | 'email' | 'password' | 'confirm_password';

function useModalA11y(isOpen: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDocKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onDocKey);
    const id = window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>('input,button,select,textarea')?.focus();
    });
    return () => {
      document.removeEventListener('keydown', onDocKey);
      window.cancelAnimationFrame(id);
    };
  }, [isOpen, onClose]);

  const onPanelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusables = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  return { panelRef, onPanelKeyDown };
}

export default function EditUserModal({ isOpen, item, onClose, onSuccess }: Props) {
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { panelRef, onPanelKeyDown } = useModalA11y(isOpen, onClose);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState<AdminRole>('admin');
  const [status, setStatus] = useState<AdminStatus>('active');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen || !item) return;
    setFullName(item.full_name);
    setEmail(item.email);
    setPassword('');
    setConfirmPassword('');
    setShowPw(false);
    setShowConfirm(false);
    setRole(item.role);
    setStatus(item.status);
    setPhone(item.phone ?? '');
    setBio(item.bio ?? '');
    setImageBase64(null);
    const u = item.avatar_url ? resolveImageSrc(item.avatar_url) : '';
    setImagePreview(u || null);
    setFileMeta(null);
    setFieldErrors({});
    setFormError('');
    setLoading(false);
  }, [isOpen, item]);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const okType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!okType) {
      setFormError('Use JPEG, PNG, or WebP only.');
      return;
    }
    setFormError('');
    setFileMeta({ name: file.name, size: file.size });
    const dataUrl = await optimizeImageForUpload(file, { maxWidth: 800, maxHeight: 800, quality: 0.88 });
    setImageBase64(dataUrl);
    setImagePreview(dataUrl);
  };

  const validate = (): boolean => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!fullName.trim()) next.full_name = 'Full name is required.';
    if (!email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length > 0) {
      if (password.length < 8) next.password = 'Password must be at least 8 characters.';
      if (password !== confirmPassword) next.confirm_password = 'Passwords do not match.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setFormError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        status,
        phone: phone.trim(),
        bio: bio.trim(),
      };
      if (password.length > 0) {
        body.password = password;
      }
      if (imageBase64) {
        body.avatar = imageBase64;
      }
      await adminRequest<AdminUser>(`/api/admin/users/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      onSuccess({ fullName: fullName.trim() });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  const showPwFields = password.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onPanelKeyDown}
        className="relative my-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            Edit user
          </h2>
          <button
            type="button"
            aria-label="Close"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onClick={() => !loading && onClose()}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full name *</label>
              <input className={`${inputClass} mt-1`} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              {fieldErrors.full_name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.full_name}</p> : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" className={`${inputClass} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} />
              {fieldErrors.email ? <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">New password</label>
              <div className="relative mt-1">
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`${inputClass} pr-10`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 hover:text-gray-800"
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password ? <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p> : null}
            </div>
            {showPwFields ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm new password</label>
                <div className="relative mt-1">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className={`${inputClass} pr-10`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 hover:text-gray-800"
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirm_password ? <p className="mt-1 text-xs text-red-600">{fieldErrors.confirm_password}</p> : null}
              </div>
            ) : (
              <div />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select className={`${inputClass} mt-1`} value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select className={`${inputClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value as AdminStatus)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input className={`${inputClass} mt-1`} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea className={`${inputClass} mt-1`} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Avatar</label>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleImage} />
            <div className="relative mx-auto mt-3 h-32 w-32">
              {imagePreview ? (
                <>
                  <div className="relative h-32 w-32 overflow-hidden rounded-full border border-gray-200 shadow">
                    <Image src={imagePreview} alt="" width={128} height={128} unoptimized className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-900 shadow focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" aria-hidden />
                        Change Photo
                      </button>
                    </div>
                  </div>
                  {fileMeta ? (
                    <p className="mt-2 text-center text-xs text-gray-600">
                      {fileMeta.name} · {(fileMeta.size / 1024).toFixed(1)} KB
                    </p>
                  ) : null}
                </>
              ) : (
                <button
                  type="button"
                  className="flex h-32 w-32 items-center justify-center rounded-full border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-600 hover:border-emerald-400"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add photo
                </button>
              )}
            </div>
          </div>

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onClick={() => !loading && onClose()}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
