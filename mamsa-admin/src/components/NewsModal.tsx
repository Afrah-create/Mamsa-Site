'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  author: string;
  published_at: string;
  created_at: string;
  status: 'draft' | 'published' | 'archived';
  featured_image?: string;
  excerpt?: string;
  tags?: string[];
}

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newsItem: Omit<NewsItem, 'id' | 'created_at'>) => void;
  editingItem?: NewsItem | null;
}

export default function NewsModal({ isOpen, onClose, onSave, editingItem }: NewsModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    featured_image: '',
    excerpt: '',
    tags: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title,
        content: editingItem.content,
        author: editingItem.author,
        status: editingItem.status,
        featured_image: editingItem.featured_image || '',
        excerpt: editingItem.excerpt || '',
        tags: editingItem.tags || []
      });
    } else {
      setFormData({
        title: '',
        content: '',
        author: '',
        status: 'draft',
        featured_image: '',
        excerpt: '',
        tags: []
      });
    }
  }, [editingItem, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      content: e.target.value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate image upload - in real app, this would upload to storage
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          featured_image: event.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call onSave and wait for it to complete
      await onSave({
        ...formData,
        published_at: new Date().toISOString()
      });
      
      // Only close modal if save was successful
      onClose();
    } catch (error) {
      console.error('Failed to save article:', error);
      // Don't close modal on error - let the parent handle the error display
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      author: '',
      status: 'draft',
      featured_image: '',
      excerpt: '',
      tags: []
    });
    setTagInput('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4 pt-8">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit Article' : 'Create New Article'}
              </h3>
              <p className="text-sm text-gray-500">
                {editingItem ? 'Update your article content and settings' : 'Write and publish a new article'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Title */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Article Title *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500"
                  placeholder="Enter article title..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.title.length}/100 characters
                </p>
              </div>

              {/* Excerpt */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                  Article Excerpt
                </label>
                <textarea
                  name="excerpt"
                  id="excerpt"
                  rows={2}
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900 placeholder-gray-500"
                  placeholder="Brief summary of your article..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.excerpt.length}/200 characters
                </p>
              </div>

              {/* Content */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Article Content *
                </label>
                <textarea
                  name="content"
                  id="content"
                  rows={8}
                  value={formData.content}
                  onChange={handleContentChange}
                  required
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-y text-gray-900 placeholder-gray-500"
                  placeholder="Write your article content here..."
                />
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                  <span>HTML: &lt;strong&gt;, &lt;em&gt;, &lt;br&gt;</span>
                  <span>{formData.content.length} chars</span>
                </div>
              </div>

              {/* Featured Image */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label htmlFor="featured_image" className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image
                </label>
                
                {formData.featured_image ? (
                  <div className="space-y-2">
                    <div className="relative inline-block">
                      <Image 
                        src={formData.featured_image} 
                        alt="Featured preview" 
                        width={200}
                        height={80}
                        className="h-20 w-full max-w-xs object-cover rounded-md border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <input
                      type="file"
                      name="featured_image"
                      id="featured_image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-xs text-gray-600 border border-dashed border-gray-300 rounded-md p-2 hover:border-blue-400 transition-colors cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-md p-4 text-center hover:border-blue-400 transition-colors">
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="mt-1">
                      <label htmlFor="featured_image" className="cursor-pointer">
                        <span className="text-xs font-medium text-blue-600 hover:text-blue-500">
                          Upload image
                        </span>
                      </label>
                      <input
                        type="file"
                        name="featured_image"
                        id="featured_image"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
              </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Publishing Status */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="text-xs font-semibold text-blue-900 mb-2">
                  Publishing Status
                </h4>
                <select
                  name="status"
                  id="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="block w-full border border-blue-200 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">📝 Draft</option>
                  <option value="published">✅ Published</option>
                  <option value="archived">📦 Archived</option>
                </select>
                <p className="mt-1 text-xs text-blue-700">
                  {formData.status === 'draft' && 'Not visible to public'}
                  {formData.status === 'published' && 'Live and visible'}
                  {formData.status === 'archived' && 'Hidden but preserved'}
                </p>
              </div>

              {/* Author */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label htmlFor="author" className="block text-xs font-medium text-gray-700 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  name="author"
                  id="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                  className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="Author name..."
                />
              </div>

              {/* Tags */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex space-x-1 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Add tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.tags.length > 0 ? (
                    formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded hover:bg-blue-200 transition-colors"
                        >
                          <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No tags</p>
                  )}
                </div>
              </div>

              {/* Article Preview */}
              <div className="bg-gray-100 p-3 rounded-lg border border-gray-200">
                <h4 className="text-xs font-semibold text-gray-800 mb-2">
                  Preview
                </h4>
                <div className="bg-white rounded-md p-3 shadow-sm border border-gray-200">
                  {formData.featured_image && (
                    <Image 
                      src={formData.featured_image} 
                      alt="Preview" 
                      width={200}
                      height={64}
                      className="w-full h-16 object-cover rounded mb-2"
                    />
                  )}
                  <h5 className="font-medium text-xs text-gray-900 mb-1 line-clamp-2">
                    {formData.title || 'Article Title'}
                  </h5>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {formData.excerpt || formData.content?.substring(0, 80) || 'Article excerpt...'}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">by {formData.author || 'Author'}</span>
                    <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                      formData.status === 'published' ? 'bg-green-100 text-green-800' :
                      formData.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formData.status}
                    </span>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-1 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                      {formData.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{formData.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 bg-gray-50 -mx-6 px-6 rounded-b-xl">
            <div className="text-xs text-gray-500">
              {formData.title && formData.content && formData.author ? (
                <span className="text-green-600 font-medium">✓ Ready to publish</span>
              ) : (
                <span>Complete required fields</span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title || !formData.content || !formData.author}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {editingItem ? 'Update' : 'Create'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
