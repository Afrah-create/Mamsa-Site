'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ImageIcon, X } from 'lucide-react';
import { optimizeImageForUpload } from '@/lib/image-client';
import { publicAssetUrl } from '@/lib/upload';
import type { NewsArticle } from '@/types/news';

type DraftPayload = Omit<NewsArticle, 'id' | 'created_at' | 'updated_at'>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DraftPayload) => Promise<void> | void;
  editingItem?: NewsArticle | null;
};

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

export default function NewsModal({ isOpen, onClose, onSave, editingItem }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [status, setStatus] = useState<NewsArticle['status']>('draft');
  const [featured, setFeatured] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [author, setAuthor] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [image, setImage] = useState('');
  const [altText, setAltText] = useState('');
  const [imageInfo, setImageInfo] = useState<{ sizeText: string; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setTitle(editingItem.title ?? '');
      setSlug(editingItem.slug ?? slugify(editingItem.title ?? ''));
      setSlugEdited(Boolean(editingItem.slug));
      setStatus(editingItem.status);
      setFeatured(editingItem.is_featured === 1);
      setExcerpt(editingItem.excerpt ?? '');
      setContent(editingItem.content ?? '');
      setTagsInput((editingItem.tags ?? []).join(', '));
      setAuthor(editingItem.author ?? '');
      setPublishedAt((editingItem.published_at ?? '').slice(0, 10));
      setImage(editingItem.featured_image ?? '');
      setAltText(editingItem.alt_text ?? '');
    } else {
      setTitle('');
      setSlug('');
      setSlugEdited(false);
      setStatus('draft');
      setFeatured(false);
      setExcerpt('');
      setContent('');
      setTagsInput('');
      setAuthor('');
      setPublishedAt('');
      setImage('');
      setAltText('');
    }
    const timer = window.setTimeout(() => firstInputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [editingItem, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (slugEdited) return;
    setSlug(slugify(title));
  }, [title, slugEdited]);

  const tags = useMemo(
    () =>
      tagsInput
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    [tagsInput],
  );

  const parseImageInfo = (base64: string) =>
    new Promise<{ sizeText: string; width: number; height: number }>((resolve) => {
      const img = new window.Image();
      img.onload = () =>
        resolve({
          sizeText: `${Math.round((base64.length * 3) / 4 / 1024)} KB`,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      img.src = base64;
    });

  const onImagePicked = async (file: File | null) => {
    if (!file) return;
    const optimized = await optimizeImageForUpload(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.8 });
    setImage(optimized);
    setImageInfo(await parseImageInfo(optimized));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        slug: slug.trim() || null,
        excerpt: excerpt.trim() || null,
        content: content.trim() || null,
        featured_image: image || null,
        alt_text: altText.trim() || null,
        status,
        tags,
        author: author.trim() || null,
        is_featured: featured ? 1 : 0,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} className="mx-auto mt-4 max-h-[92vh] w-full max-w-3xl overflow-auto rounded-xl bg-white shadow-2xl">
        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h3 className="text-lg font-semibold text-gray-900">{editingItem ? 'Edit Article' : 'Create Article'}</h3>
            <button type="button" onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Title *</label>
              <input ref={firstInputRef} value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Slug</label>
              <input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as NewsArticle['status'])} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <label className="mt-6 inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
              Featured
            </label>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Excerpt</label>
              <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Content *</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Tags</label>
              <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="alumni, conference" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Author</label>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Published date</label>
              <input type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Alt text</label>
              <input value={altText} onChange={(e) => setAltText(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Featured image</label>
              <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 p-4 hover:border-emerald-500">
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void onImagePicked(e.target.files?.[0] ?? null)} />
                <span className="text-sm text-gray-500">Click or drag to upload</span>
              </label>
              {image ? (
                <div className="mt-3 rounded-lg border border-gray-200 p-2">
                  <Image src={publicAssetUrl(image)} alt={altText || title || 'Preview'} width={720} height={320} className="max-h-48 w-full rounded object-contain" unoptimized />
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{imageInfo ? `${imageInfo.width}x${imageInfo.height}` : ''}</span>
                    <span>{imageInfo?.sizeText ?? ''}</span>
                    <button type="button" className="text-red-600" onClick={() => setImage('')}>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <ImageIcon className="h-4 w-4" />
                  No image selected
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !title.trim() || !content.trim()} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {submitting ? 'Saving...' : editingItem ? 'Update Article' : 'Create Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
