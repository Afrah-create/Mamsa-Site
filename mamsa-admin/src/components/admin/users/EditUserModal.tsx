'use client';

import { useEffect, useState } from 'react';
import { adminRequest } from '@/lib/admin-api';
import { optimizeImageForUpload } from '@/lib/image-client';
import { publicAssetUrl } from '@/lib/upload';

type Props = {
  isOpen: boolean;
  item: Record<string, unknown> | null;
  onClose: () => void;
  onSuccess: () => void;
};

const inputClass =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500';

const ROLES = ['super_admin', 'admin', 'moderator'] as const;

export default function EditUserModal({ isOpen, item, onClose, onSuccess }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<(typeof ROLES)[number]>('admin');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen || !item) return;
    setFullName(String(item.full_name ?? ''));
    setEmail(String(item.email ?? ''));
    setPassword('');
    setRole((ROLES.includes(item.role as (typeof ROLES)[number]) ? item.role : 'admin') as (typeof ROLES)[number]);
    setImageBase64(null);
    const u = item.avatar_url != null ? publicAssetUrl(String(item.avatar_url)) : '';
    setImagePreview(u || null);
    setFormError('');
    setLoading(false);
  }, [isOpen, item]);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await optimizeImageForUpload(file, { maxWidth: 512, maxHeight: 512, quality: 0.85 });
    setImageBase64(dataUrl);
    setImagePreview(dataUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setFormError('');
    if (!fullName.trim() || !email.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    if (password.length > 0 && password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    const id = Number(item.id);
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        full_name: fullName.trim(),
        email: email.trim(),
        role,
      };
      if (password.length > 0) {
        body.password = password;
      }
      if (imageBase64) {
        body.avatar = imageBase64;
      }
      await adminRequest(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
      <div className="relative my-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900">Edit user</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Full name
            <input className={`${inputClass} mt-1`} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Email
            <input type="email" className={`${inputClass} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            New password (optional)
            <input
              type="password"
              className={`${inputClass} mt-1`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Role
            <select className={`${inputClass} mt-1`} value={role} onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Replace avatar
            <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={handleImage} />
          </label>
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : null}
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => !loading && onClose()}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
