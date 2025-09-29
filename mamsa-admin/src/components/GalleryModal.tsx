'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface GalleryImage {
  id: number;
  title: string;
  description: string;
  image_url: string;
  category: string;
  tags?: string[];
  photographer?: string;
  location?: string;
  event_date?: string;
  file_size?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  alt_text?: string;
  created_at: string;
}

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageData: Omit<GalleryImage, 'id' | 'created_at'>) => void;
  editingItem?: GalleryImage | null;
}

export default function GalleryModal({ isOpen, onClose, onSave, editingItem }: GalleryModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    category: 'events',
    tags: [] as string[],
    photographer: '',
    location: '',
    event_date: '',
    file_size: 0,
    dimensions: {
      width: 0,
      height: 0
    },
    status: 'published' as 'published' | 'draft' | 'archived',
    featured: false,
    alt_text: ''
  });
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title,
        description: editingItem.description,
        image_url: editingItem.image_url,
        category: editingItem.category,
        tags: editingItem.tags || [],
        photographer: editingItem.photographer || '',
        location: editingItem.location || '',
        event_date: editingItem.event_date || '',
        file_size: editingItem.file_size || 0,
        dimensions: editingItem.dimensions || { width: 0, height: 0 },
        status: editingItem.status,
        featured: editingItem.featured,
        alt_text: editingItem.alt_text || ''
      });
      setImagePreview(editingItem.image_url);
    } else {
      setFormData({
        title: '',
        description: '',
        image_url: '',
        category: 'events',
        tags: [],
        photographer: '',
        location: '',
        event_date: '',
        file_size: 0,
        dimensions: { width: 0, height: 0 },
        status: 'published',
        featured: false,
        alt_text: ''
      });
      setImagePreview(null);
    }
  }, [editingItem, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate file processing
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          image_url: imageUrl,
          file_size: file.size,
          alt_text: file.name.split('.')[0]
        }));
        setImagePreview(imageUrl);

        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          setFormData(prev => ({
            ...prev,
            dimensions: {
              width: img.width,
              height: img.height
            }
          }));
        };
        img.src = imageUrl;
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save gallery image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      category: 'events',
      tags: [],
      photographer: '',
      location: '',
      event_date: '',
      file_size: 0,
      dimensions: { width: 0, height: 0 },
      status: 'published',
      featured: false,
      alt_text: ''
    });
    setTagInput('');
    setImagePreview(null);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4 pt-8">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit Gallery Image' : 'Upload New Image'}
              </h3>
              <p className="text-sm text-gray-500">
                {editingItem ? 'Update image details and metadata' : 'Add a new image to the gallery'}
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
              {/* Image Upload */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label htmlFor="image_url" className="block text-sm font-semibold text-gray-800 mb-3">
                  Image Upload *
                </label>
                
                {imagePreview ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Image 
                        src={imagePreview} 
                        alt="Preview" 
                        width={400}
                        height={300}
                        className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, image_url: '' }));
                          setImagePreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <input
                      type="file"
                      name="image_url"
                      id="image_url"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-gray-600 border border-dashed border-gray-300 rounded-md p-2 hover:border-orange-400 transition-colors cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="mt-4">
                      <label htmlFor="image_url" className="cursor-pointer">
                        <span className="text-sm font-medium text-orange-600 hover:text-orange-500">
                          Click to upload image
                        </span>
                      </label>
                      <input
                        type="file"
                        name="image_url"
                        id="image_url"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </div>

              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Basic Information</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Image Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="Enter image title..."
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                      placeholder="Describe the image..."
                    />
                  </div>
                  <div>
                    <label htmlFor="alt_text" className="block text-sm font-medium text-gray-700 mb-2">
                      Alt Text (Accessibility)
                    </label>
                    <input
                      type="text"
                      name="alt_text"
                      id="alt_text"
                      value={formData.alt_text}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="Describe the image for screen readers..."
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Tags
                </label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Add tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.length > 0 ? (
                    formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-orange-200 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 italic">No tags added yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Category */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="text-sm font-semibold text-orange-900 mb-3">Category</h4>
                <select
                  name="category"
                  id="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="block w-full border border-orange-200 rounded-md px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="events">📅 Events</option>
                  <option value="conferences">🎤 Conferences</option>
                  <option value="meetings">👥 Meetings</option>
                  <option value="social">🎉 Social</option>
                  <option value="academic">🎓 Academic</option>
                  <option value="community">🤝 Community Service</option>
                  <option value="leadership">👑 Leadership</option>
                  <option value="awards">🏆 Awards</option>
                  <option value="general">📸 General</option>
                </select>
              </div>

              {/* Status */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Status</h4>
                <select
                  name="status"
                  id="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="published">✅ Published</option>
                  <option value="draft">📝 Draft</option>
                  <option value="archived">📦 Archived</option>
                </select>
                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">
                    Featured Image
                  </label>
                </div>
              </div>

              {/* Image Details */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Image Details</h4>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="photographer" className="block text-xs font-medium text-gray-700 mb-1">
                      Photographer
                    </label>
                    <input
                      type="text"
                      name="photographer"
                      value={formData.photographer}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Photographer name..."
                    />
                  </div>
                  <div>
                    <label htmlFor="location" className="block text-xs font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Where was this taken?"
                    />
                  </div>
                  <div>
                    <label htmlFor="event_date" className="block text-xs font-medium text-gray-700 mb-1">
                      Event Date
                    </label>
                    <input
                      type="date"
                      name="event_date"
                      value={formData.event_date}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              {formData.file_size > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Technical Details</h4>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>File Size:</span>
                      <span>{formatFileSize(formData.file_size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dimensions:</span>
                      <span>{formData.dimensions.width} × {formData.dimensions.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aspect Ratio:</span>
                      <span>{formData.dimensions.width && formData.dimensions.height ? 
                        (formData.dimensions.width / formData.dimensions.height).toFixed(2) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Preview */}
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Preview</h4>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  {imagePreview ? (
                    <div>
                      <Image 
                        src={imagePreview} 
                        alt="Preview" 
                        width={200}
                        height={150}
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                      <h5 className="font-medium text-xs text-gray-900 truncate mb-1">
                        {formData.title || 'Image Title'}
                      </h5>
                      <p className="text-xs text-gray-600 truncate">
                        {formData.description || 'Image description...'}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-gray-500">{formData.category}</span>
                        <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                          formData.status === 'published' ? 'bg-green-100 text-green-800' :
                          formData.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {formData.status}
                        </span>
                      </div>
                      {formData.featured && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            ⭐ Featured
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-500 mt-1">No image uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200 bg-gray-50 -mx-6 px-6 rounded-b-xl">
            <div className="text-sm text-gray-500">
              {formData.title && formData.image_url ? (
                <span className="text-orange-600 font-medium">✓ Ready to upload</span>
              ) : (
                <span>Complete required fields</span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title || !formData.image_url}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {editingItem ? 'Update Image' : 'Upload Image'}
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
