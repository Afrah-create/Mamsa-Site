'use client';

import { useEffect, useState } from 'react';
import { adminRequest } from '@/lib/admin-api';
import { optimizeImageForUpload } from '@/lib/image-client';
import { resolveImageSrc } from '@/lib/image-utils';

type Props = {
  isOpen: boolean;
  item: Record<string, unknown> | null;
  onClose: () => void;
  onSuccess: () => void;
};

const inputClass =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500';

export default function EditLeadershipModal({ isOpen, item, onClose, onSuccess }: Props) {
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen || !item) return;
    setFullName(String(item.name ?? ''));
    setPosition(String(item.position ?? ''));
    setBio(String(item.bio ?? ''));
    setEmail(String(item.email ?? ''));
    setPhone(String(item.phone ?? ''));
    setDisplayOrder(Number(item.order_position ?? 0));
    setIsActive(String(item.status ?? 'active') === 'active');
    setImageBase64(null);
    const u = item.image_url != null ? resolveImageSrc(String(item.image_url)) : '';
    setImagePreview(u || null);
    setFormError('');
    setLoading(false);
  }, [isOpen, item]);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await optimizeImageForUpload(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });
    setImageBase64(dataUrl);
    setImagePreview(dataUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setFormError('');
    if (!fullName.trim()) {
      setFormError('Name is required.');
      return;
    }
    const id = Number(item.id);
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: fullName.trim(),
        position: position.trim() || null,
        bio: bio.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        order_position: displayOrder,
        is_active: isActive ? 1 : 0,
      };
      if (imageBase64) body.image_url = imageBase64;
      await adminRequest(`/api/admin/leadership/${id}`, {
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
      <div className="relative my-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900">Edit member</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Full name
            <input className={`${inputClass} mt-1`} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Position / title
            <input className={`${inputClass} mt-1`} value={position} onChange={(e) => setPosition(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Bio
            <textarea className={`${inputClass} mt-1`} rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Email
            <input type="email" className={`${inputClass} mt-1`} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Phone
            <input className={`${inputClass} mt-1`} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Display order
            <input
              type="number"
              className={`${inputClass} mt-1`}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Replace image
            <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={handleImage} />
          </label>
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="" className="h-28 max-w-full rounded border object-contain" />
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
