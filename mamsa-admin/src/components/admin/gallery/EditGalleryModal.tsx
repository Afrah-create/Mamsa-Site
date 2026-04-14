'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ImageIcon, Loader2, X } from 'lucide-react';
import { adminRequest } from '@/lib/admin-api';
import { optimizeImageForUpload } from '@/lib/image-client';
import { publicAssetUrl } from '@/lib/upload';
import type { GalleryItem } from '@/types/gallery';

type Props = {
  isOpen: boolean;
  item: GalleryItem | null;
  existingCategories: string[];
  onClose: () => void;
  onSuccess: (meta: { title: string }) => void;
};

const inputClass =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500';

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

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EditGalleryModal({ isOpen, item, existingCategories, onClose, onSuccess }: Props) {
  const titleId = useId();
  const listId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { panelRef, onPanelKeyDown } = useModalA11y(isOpen, onClose);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [photographer, setPhotographer] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [altText, setAltText] = useState('');
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [displayPreview, setDisplayPreview] = useState<string | null>(null);
  const [newBase64, setNewBase64] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ width: number; height: number; size: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen || !item) return;
    setTitle(item.title);
    setDescription(item.description ?? '');
    setCategory(item.category ?? '');
    setPhotographer(item.photographer ?? '');
    setLocation(item.location ?? '');
    setEventDate(item.event_date ?? '');
    setTags(item.tags?.length ? [...item.tags] : []);
    setTagInput('');
    setIsFeatured(item.is_featured === 1);
    setStatus(item.status === 'inactive' ? 'inactive' : 'active');
    setAltText(item.alt_text ?? '');
    setNewBase64(null);
    setFileMeta(
      item.dimensions && item.file_size != null
        ? { width: item.dimensions.width, height: item.dimensions.height, size: item.file_size }
        : item.dimensions
          ? { width: item.dimensions.width, height: item.dimensions.height, size: item.file_size ?? 0 }
          : null,
    );
    const base = item.image_url?.trim() ? publicAssetUrl(item.image_url) : '';
    setOriginalPreview(base || null);
    setDisplayPreview(base || null);
    setTitleError('');
    setFormError('');
    setLoading(false);
  }, [isOpen, item]);

  const commitTagInput = useCallback((rawInput: string) => {
    const raw = rawInput.trim();
    if (!raw) return;
    const parts = raw.split(',').map((t) => t.trim()).filter(Boolean);
    if (parts.length === 0) return;
    setTags((prev) => {
      const next = [...prev];
      for (const p of parts) {
        if (!next.includes(p)) next.push(p);
      }
      return next;
    });
    setTagInput('');
  }, []);

  const ingestFile = async (file: File | null | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|jpe?g|png|webp)$/i.test(file.type)) {
      setFormError('Please choose a JPEG, PNG, or WebP image.');
      return;
    }
    setFormError('');
    const dataUrl = await optimizeImageForUpload(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.85,
    });
    setNewBase64(dataUrl);
    setDisplayPreview(dataUrl);
    setFileMeta({ width: 0, height: 0, size: file.size });
    const img = new window.Image();
    img.onload = () => {
      setFileMeta({ width: img.naturalWidth, height: img.naturalHeight, size: file.size });
    };
    img.src = dataUrl;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    await ingestFile(f);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    await ingestFile(f);
  };

  const clearNewImage = () => {
    setNewBase64(null);
    setDisplayPreview(originalPreview);
    if (item?.dimensions && item.file_size != null) {
      setFileMeta({
        width: item.dimensions.width,
        height: item.dimensions.height,
        size: item.file_size,
      });
    } else {
      setFileMeta(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setFormError('');
    setTitleError('');
    if (!title.trim()) {
      setTitleError('Title is required.');
      return;
    }
    setLoading(true);
    try {
      const dim =
        newBase64 && fileMeta && fileMeta.width > 0 && fileMeta.height > 0
          ? { width: fileMeta.width, height: fileMeta.height }
          : undefined;
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim() || null,
        photographer: photographer.trim() || null,
        location: location.trim() || null,
        event_date: eventDate || null,
        tags,
        is_featured: isFeatured ? 1 : 0,
        status,
        alt_text: altText.trim() || null,
      };
      if (newBase64) {
        body.image_url = newBase64;
        body.file_size = fileMeta?.size ?? null;
        body.dimensions = dim ?? null;
      }
      await adminRequest<GalleryItem>(`/api/admin/gallery/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      onSuccess({ title: title.trim() });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8"
      role="presentation"
      onClick={() => !loading && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onPanelKeyDown}
        className="relative my-4 w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            Edit gallery item
          </h2>
          <button
            type="button"
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
            onClick={() => !loading && onClose()}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              className={`${inputClass} mt-1`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={Boolean(titleError)}
            />
            {titleError ? <p className="mt-1 text-xs text-red-600">{titleError}</p> : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea className={`${inputClass} mt-1`} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input className={`${inputClass} mt-1`} value={category} onChange={(e) => setCategory(e.target.value)} list={listId} />
              <datalist id={listId}>
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Photographer</label>
              <input className={`${inputClass} mt-1`} value={photographer} onChange={(e) => setPhotographer(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input className={`${inputClass} mt-1`} value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Event date</label>
              <input type="date" className={`${inputClass} mt-1`} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tags</label>
            <p className="text-xs text-gray-500">Type and press comma or Enter to add chips.</p>
            <div className="mt-1 flex flex-wrap gap-1 rounded-md border border-gray-300 px-2 py-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/30">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                >
                  {t}
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-800"
                    onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                    aria-label={`Remove ${t}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-sm outline-none"
                value={tagInput}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.endsWith(',')) {
                    commitTagInput(v.slice(0, -1));
                    return;
                  }
                  setTagInput(v);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitTagInput((e.target as HTMLInputElement).value);
                  }
                  if (e.key === 'Backspace' && !tagInput && tags.length) {
                    setTags((prev) => prev.slice(0, -1));
                  }
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:items-end">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-800">Featured</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select className={`${inputClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Alt text</label>
            <input className={`${inputClass} mt-1`} value={altText} onChange={(e) => setAltText(e.target.value)} />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Photo</p>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleImageChange} />
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="relative mt-2 overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
            >
              {displayPreview ? (
                <div className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={displayPreview} alt="" className="mx-auto max-h-48 w-full object-contain" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      type="button"
                      className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace photo
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="flex w-full flex-col items-center gap-2 py-10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-10 w-10 text-gray-400" />
                  <span className="text-sm text-gray-600">Add photo</span>
                </button>
              )}
            </div>
            {newBase64 ? (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                {fileMeta && fileMeta.width > 0 ? (
                  <span>
                    {fileMeta.width}×{fileMeta.height}px · {formatBytes(fileMeta.size)}
                  </span>
                ) : null}
                <button type="button" className="font-medium text-red-600 hover:text-red-700" onClick={clearNewImage}>
                  Restore original
                </button>
              </div>
            ) : fileMeta && fileMeta.width > 0 ? (
              <p className="mt-1 text-xs text-gray-500">
                {fileMeta.width}×{fileMeta.height}px
                {item.file_size != null ? ` · ${formatBytes(item.file_size)}` : ''}
              </p>
            ) : null}
          </div>

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button type="button" className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => !loading && onClose()}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
