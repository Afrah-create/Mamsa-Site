'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface LeadershipMember {
  id: number;
  name: string;
  position: string;
  bio: string;
  image_url: string;
  email?: string;
  phone?: string;
  department?: string;
  year?: string;
  social_links?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  status: 'active' | 'inactive' | 'alumni';
  order: number;
  created_at: string;
}

interface LeadershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: Omit<LeadershipMember, 'id' | 'created_at'>) => void;
  editingItem?: LeadershipMember | null;
}

export default function LeadershipModal({ isOpen, onClose, onSave, editingItem }: LeadershipModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    bio: '',
    image_url: '',
    email: '',
    phone: '',
    department: '',
    year: '',
    social_links: {
      linkedin: '',
      twitter: '',
      instagram: ''
    },
    status: 'active' as 'active' | 'inactive' | 'alumni',
    order: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        position: editingItem.position,
        bio: editingItem.bio,
        image_url: editingItem.image_url,
        email: editingItem.email || '',
        phone: editingItem.phone || '',
        department: editingItem.department || '',
        year: editingItem.year || '',
        social_links: {
          linkedin: editingItem.social_links?.linkedin || '',
          twitter: editingItem.social_links?.twitter || '',
          instagram: editingItem.social_links?.instagram || ''
        },
        status: editingItem.status,
        order: editingItem.order
      });
    } else {
      setFormData({
        name: '',
        position: '',
        bio: '',
        image_url: '',
        email: '',
        phone: '',
        department: '',
        year: '',
        social_links: {
          linkedin: '',
          twitter: '',
          instagram: ''
        },
        status: 'active',
        order: 0
      });
    }
  }, [editingItem, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('social_links.')) {
      const socialKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [socialKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : value
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          image_url: event.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save leadership member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      position: '',
      bio: '',
      image_url: '',
      email: '',
      phone: '',
      department: '',
      year: '',
      social_links: {
        linkedin: '',
        twitter: '',
        instagram: ''
      },
      status: 'active',
      order: 0
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4 pt-8">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit Leadership Member' : 'Add New Leadership Member'}
              </h3>
              <p className="text-sm text-gray-500">
                {editingItem ? 'Update member information and details' : 'Add a new member to the leadership team'}
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
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="Enter full name..."
                    />
                  </div>
                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                      Position *
                    </label>
                    <input
                      type="text"
                      name="position"
                      id="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      required
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="e.g., President, Vice President..."
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label htmlFor="bio" className="block text-sm font-semibold text-gray-800 mb-3">
                  Biography *
                </label>
                <textarea
                  name="bio"
                  id="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange}
                  required
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-y"
                  placeholder="Tell us about this leadership member's background, achievements, and role..."
                />
                <p className="mt-1 text-xs text-gray-500">{formData.bio.length} characters</p>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Academic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                      Department/Program
                    </label>
                    <input
                      type="text"
                      name="department"
                      id="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="e.g., Medicine, Public Health..."
                    />
                  </div>
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year
                    </label>
                    <input
                      type="text"
                      name="year"
                      id="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      placeholder="e.g., Class of 2025, Year 3..."
                    />
                  </div>
                </div>
              </div>

              {/* Profile Image */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label htmlFor="image_url" className="block text-sm font-semibold text-gray-800 mb-3">
                  Profile Image
                </label>
                
                {formData.image_url ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <Image 
                        src={formData.image_url} 
                        alt="Profile preview" 
                        width={120}
                        height={120}
                        className="h-24 w-24 object-cover rounded-full border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
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
                      className="block w-full text-sm text-gray-600 border border-dashed border-gray-300 rounded-md p-2 hover:border-purple-400 transition-colors cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-md p-6 text-center hover:border-purple-400 transition-colors">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div className="mt-2">
                      <label htmlFor="image_url" className="cursor-pointer">
                        <span className="text-sm font-medium text-purple-600 hover:text-purple-500">
                          Upload profile photo
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
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Status */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="text-sm font-semibold text-purple-900 mb-3">Member Status</h4>
                <select
                  name="status"
                  id="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="block w-full border border-purple-200 rounded-md px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="active">🟢 Active</option>
                  <option value="inactive">⏸️ Inactive</option>
                  <option value="alumni">🎓 Alumni</option>
                </select>
                <p className="mt-2 text-xs text-purple-700">
                  {formData.status === 'active' && 'Currently serving in leadership role'}
                  {formData.status === 'inactive' && 'Temporarily inactive'}
                  {formData.status === 'alumni' && 'Former leadership member'}
                </p>
              </div>

              {/* Display Order */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label htmlFor="order" className="block text-sm font-semibold text-gray-800 mb-3">
                  Display Order
                </label>
                <input
                  type="number"
                  name="order"
                  id="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  min="0"
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Order in leadership list..."
                />
                <p className="mt-1 text-xs text-gray-500">Lower numbers appear first</p>
              </div>

              {/* Social Media Links */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Social Media Links</h4>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="social_links.linkedin" className="block text-xs font-medium text-gray-700 mb-1">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      name="social_links.linkedin"
                      value={formData.social_links.linkedin}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <label htmlFor="social_links.twitter" className="block text-xs font-medium text-gray-700 mb-1">
                      Twitter
                    </label>
                    <input
                      type="url"
                      name="social_links.twitter"
                      value={formData.social_links.twitter}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                  <div>
                    <label htmlFor="social_links.instagram" className="block text-xs font-medium text-gray-700 mb-1">
                      Instagram
                    </label>
                    <input
                      type="url"
                      name="social_links.instagram"
                      value={formData.social_links.instagram}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                </div>
              </div>

              {/* Member Preview */}
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Preview</h4>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="text-center">
                    {formData.image_url ? (
                      <Image 
                        src={formData.image_url} 
                        alt="Preview" 
                        width={60}
                        height={60}
                        className="h-12 w-12 object-cover rounded-full mx-auto mb-2"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          {formData.name.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <h5 className="font-medium text-sm text-gray-900 truncate">
                      {formData.name || 'Member Name'}
                    </h5>
                    <p className="text-xs text-purple-600 mb-2">
                      {formData.position || 'Position'}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {formData.bio || 'Member biography...'}
                    </p>
                    <div className="mt-2 flex justify-center space-x-1">
                      {formData.social_links.linkedin && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      {formData.social_links.twitter && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      )}
                      {formData.social_links.instagram && (
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200 bg-gray-50 -mx-6 px-6 rounded-b-xl">
            <div className="text-sm text-gray-500">
              {formData.name && formData.position && formData.bio ? (
                <span className="text-purple-600 font-medium">✓ Ready to save</span>
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
                disabled={loading || !formData.name || !formData.position || !formData.bio}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {editingItem ? 'Update Member' : 'Add Member'}
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
