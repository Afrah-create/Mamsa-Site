'use client';

import { useEffect, useState } from 'react';
import { adminRequest } from '@/lib/admin-api';
import { optimizeImageForUpload } from '@/lib/image-client';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const inputClass =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500';

export default function CreateGalleryModal({ isOpen, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setDescription('');
    setCategory('');
    setTagsText('');
    setIsFeatured(false);
    setImageBase64(null);
    setImagePreview(null);
    setFormError('');
    setLoading(false);
  }, [isOpen]);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await optimizeImageForUpload(file, {
      maxWidth: 2000,
      maxHeight: 2000,
      quality: 0.82,
    });
    setImageBase64(dataUrl);
    setImagePreview(dataUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim()) {
      setFormError('Title is required.');
      return;
    }
    setLoading(true);
    try {
      await adminRequest('/api/admin/gallery', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
          tags: tagsText,
          is_featured: isFeatured ? 1 : 0,
          ...(imageBase64 ? { image_url: imageBase64 } : {}),
        }),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
      <div className="relative my-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900">Add gallery item</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Title
            <input className={`${inputClass} mt-1`} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Description
            <textarea className={`${inputClass} mt-1`} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Category
            <input className={`${inputClass} mt-1`} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. events" />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Tags (comma-separated)
            <input className={`${inputClass} mt-1`} value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Featured
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Image
            <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={handleImage} />
          </label>
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="" className="h-32 w-auto max-w-full rounded border object-contain" />
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
              {loading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
