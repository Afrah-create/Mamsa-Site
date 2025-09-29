'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AdminLayout from '@/components/AdminLayout';
import GalleryModal from '@/components/GalleryModal';
import ConfirmModal from '@/components/ConfirmModal';
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

export default function GalleryPage() {
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryImage | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<GalleryImage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  const supabase = createClient();

  // Static data for demonstration
  const staticGallery: GalleryImage[] = [
    {
      id: 1,
      title: 'MAMSA Annual Conference 2024',
      description: 'Opening ceremony of the MAMSA Annual Conference featuring keynote speaker Dr. Sarah Wilson discussing medical innovation and student leadership.',
      image_url: '',
      category: 'conferences',
      tags: ['conference', 'keynote', 'leadership', 'medical'],
      photographer: 'John Smith',
      location: 'University Auditorium',
      event_date: '2024-03-15',
      file_size: 2048576,
      dimensions: { width: 1920, height: 1080 },
      status: 'published',
      featured: true,
      alt_text: 'Conference keynote speaker on stage',
      created_at: '2024-03-15T10:00:00Z'
    },
    {
      id: 2,
      title: 'Community Health Fair',
      description: 'MAMSA students volunteering at the annual community health fair, providing free health screenings and education to local residents.',
      image_url: '',
      category: 'community',
      tags: ['volunteer', 'health', 'community', 'service'],
      photographer: 'Emily Chen',
      location: 'Downtown Community Center',
      event_date: '2024-02-20',
      file_size: 1536000,
      dimensions: { width: 1600, height: 1200 },
      status: 'published',
      featured: false,
      alt_text: 'Students conducting health screenings',
      created_at: '2024-02-20T14:30:00Z'
    },
    {
      id: 3,
      title: 'Leadership Team Meeting',
      description: 'Monthly leadership team meeting discussing upcoming events and strategic planning for the semester.',
      image_url: '',
      category: 'leadership',
      tags: ['meeting', 'planning', 'leadership', 'strategy'],
      photographer: 'Michael Rodriguez',
      location: 'MAMSA Office',
      event_date: '2024-01-25',
      file_size: 1280000,
      dimensions: { width: 1200, height: 800 },
      status: 'published',
      featured: false,
      alt_text: 'Leadership team around conference table',
      created_at: '2024-01-25T16:00:00Z'
    },
    {
      id: 4,
      title: 'Graduation Celebration',
      description: 'Celebrating our graduating members at the end-of-year ceremony with awards and recognition for outstanding contributions.',
      image_url: '',
      category: 'awards',
      tags: ['graduation', 'awards', 'celebration', 'achievement'],
      photographer: 'Lisa Park',
      location: 'Campus Ballroom',
      event_date: '2024-05-10',
      file_size: 2560000,
      dimensions: { width: 2048, height: 1536 },
      status: 'published',
      featured: true,
      alt_text: 'Graduates receiving awards on stage',
      created_at: '2024-05-10T18:00:00Z'
    },
    {
      id: 5,
      title: 'Study Group Session',
      description: 'Peer study group session helping first-year students prepare for their upcoming exams with collaborative learning.',
      image_url: '',
      category: 'academic',
      tags: ['study', 'peer-tutoring', 'academic', 'collaboration'],
      photographer: 'David Kim',
      location: 'Medical Library',
      event_date: '2024-04-05',
      file_size: 1024000,
      dimensions: { width: 1280, height: 960 },
      status: 'published',
      featured: false,
      alt_text: 'Students studying together in library',
      created_at: '2024-04-05T19:00:00Z'
    },
    {
      id: 6,
      title: 'Social Mixer Event',
      description: 'Annual social mixer bringing together medical students from all years for networking and building community connections.',
      image_url: '',
      category: 'social',
      tags: ['social', 'networking', 'community', 'mixer'],
      photographer: 'Anna Johnson',
      location: 'Student Center',
      event_date: '2024-03-28',
      file_size: 1800000,
      dimensions: { width: 1600, height: 1067 },
      status: 'published',
      featured: false,
      alt_text: 'Students socializing at mixer event',
      created_at: '2024-03-28T20:00:00Z'
    },
    {
      id: 7,
      title: 'Research Symposium Poster',
      description: 'Draft poster for upcoming research symposium showcasing student research projects and findings.',
      image_url: '',
      category: 'academic',
      tags: ['research', 'poster', 'symposium', 'presentation'],
      photographer: 'Robert Wilson',
      location: 'Research Lab',
      event_date: '2024-04-15',
      file_size: 512000,
      dimensions: { width: 800, height: 600 },
      status: 'draft',
      featured: false,
      alt_text: 'Research poster draft layout',
      created_at: '2024-04-10T15:30:00Z'
    },
    {
      id: 8,
      title: 'Alumni Networking Event',
      description: 'Annual alumni networking event connecting current students with MAMSA graduates in various medical specialties.',
      image_url: '',
      category: 'events',
      tags: ['alumni', 'networking', 'career', 'mentorship'],
      photographer: 'Jennifer Liu',
      location: 'Alumni Hall',
      event_date: '2024-02-10',
      file_size: 2240000,
      dimensions: { width: 1920, height: 1280 },
      status: 'archived',
      featured: false,
      alt_text: 'Alumni and students networking',
      created_at: '2024-02-10T17:30:00Z'
    }
  ];

  useEffect(() => {
    checkAuth();
    loadGallery();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        window.location.href = '/login';
        return;
      }

      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (adminError || !adminData) {
        window.location.href = '/login';
        return;
      }

      setUser(user);
    } catch (error) {
      console.error('Auth check failed:', error);
      window.location.href = '/login';
    }
  };

  const loadGallery = async () => {
    try {
      setLoading(true);
      // Use static data for demonstration
      setGallery(staticGallery);
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations
  const handleCreateImage = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEditImage = (image: GalleryImage) => {
    setEditingItem(image);
    setShowModal(true);
  };

  const handleDeleteImage = (image: GalleryImage) => {
    setItemToDelete(image);
    setShowConfirm(true);
  };

  const handleSaveImage = (imageData: Omit<GalleryImage, 'id' | 'created_at'>) => {
    if (editingItem) {
      // Update existing image
      setGallery(prev => prev.map(image => 
        image.id === editingItem.id 
          ? { ...imageData, id: editingItem.id, created_at: editingItem.created_at }
          : image
      ));
    } else {
      // Create new image
      const newImage: GalleryImage = {
        ...imageData,
        id: Math.max(...gallery.map(i => i.id), 0) + 1,
        created_at: new Date().toISOString()
      };
      setGallery(prev => [...prev, newImage]);
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setGallery(prev => prev.filter(image => image.id !== itemToDelete.id));
      setShowConfirm(false);
      setItemToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    setGallery(prev => prev.filter(image => !selectedItems.includes(image.id)));
    setSelectedItems([]);
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredGallery.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredGallery.map(image => image.id));
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Filter gallery based on search, category, and status
  const filteredGallery = gallery.filter(image => {
    const matchesSearch = image.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         image.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         image.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         image.photographer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         image.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || image.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || image.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    // Featured images first, then by creation date
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AdminLayout user={user}>
      <div className="w-full">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Gallery Management</h2>
                <p className="text-sm text-gray-500 mt-1">Manage MAMSA photos, events, and media assets</p>
              </div>
              <button 
                onClick={handleCreateImage}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto flex items-center justify-center"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload New Image
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search images by title, description, tags, photographer, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">All Categories</option>
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
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft' | 'archived')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="all">All Status</option>
                  <option value="published">✅ Published</option>
                  <option value="draft">📝 Draft</option>
                  <option value="archived">📦 Archived</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedItems.length} image{selectedItems.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleBulkDelete}
                      className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Delete Selected
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Gallery Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading gallery...</p>
              </div>
            ) : filteredGallery.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {gallery.length === 0 ? 'No images in gallery' : 'No images match your search'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {gallery.length === 0 ? 'Get started by uploading your first image.' : 'Try adjusting your search or filter criteria.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Select All */}
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredGallery.length && filteredGallery.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Select All</label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 lg:gap-8">
                  {filteredGallery.map((image) => (
                    <div key={image.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all duration-300 transform hover:-translate-y-1">
                      {/* Image Container */}
                      <div className="relative overflow-hidden">
                        <div className="aspect-square bg-gray-100">
                          {image.image_url ? (
                            <Image 
                              src={image.image_url} 
                              alt={image.alt_text || image.title}
                              width={400}
                              height={400}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {/* Overlay with Checkbox and Badges */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300">
                          {/* Checkbox */}
                          <div className="absolute top-3 left-3">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(image.id)}
                              onChange={() => handleSelectItem(image.id)}
                              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            />
                          </div>

                          {/* Status and Featured badges */}
                          <div className="absolute top-3 right-3 flex flex-col space-y-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm ${
                              image.status === 'published' ? 'bg-green-500/90 text-white' :
                              image.status === 'draft' ? 'bg-yellow-500/90 text-white' :
                              'bg-gray-500/90 text-white'
                            }`}>
                              {image.status === 'published' && '✅'}
                              {image.status === 'draft' && '📝'}
                              {image.status === 'archived' && '📦'}
                            </span>
                            {image.featured && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500/90 text-white shadow-sm backdrop-blur-sm">
                                ⭐ Featured
                              </span>
                            )}
                          </div>

                          {/* Category Badge */}
                          <div className="absolute bottom-3 left-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700 shadow-sm backdrop-blur-sm capitalize">
                              {image.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="p-4 lg:p-5">
                        <div className="space-y-3">
                          {/* Title */}
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                            {image.title}
                          </h3>
                          
                          {/* Description */}
                          <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                            {image.description}
                          </p>
                          
                          {/* Tags */}
                          {image.tags && image.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {image.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {image.tags.length > 2 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                                  +{image.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Metadata */}
                          <div className="space-y-2 pt-2 border-t border-gray-100">
                            {/* File Size and Date */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              {image.file_size && (
                                <span className="flex items-center">
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  {formatFileSize(image.file_size)}
                                </span>
                              )}
                              {image.event_date && (
                                <span className="flex items-center">
                                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {new Date(image.event_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            {/* Photographer */}
                            {image.photographer && (
                              <div className="flex items-center text-xs text-gray-500">
                                <svg className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="truncate">by {image.photographer}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="mt-4 flex justify-center space-x-2">
                          <button 
                            onClick={() => handleEditImage(image)}
                            className="flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-xs font-medium px-3 py-2 rounded-lg border border-orange-200 hover:border-orange-300 transition-all duration-200"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteImage(image)}
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-medium px-3 py-2 rounded-lg border border-red-200 hover:border-red-300 transition-all duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            {filteredGallery.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-semibold text-green-600">
                      {filteredGallery.filter(i => i.status === 'published').length}
                    </div>
                    <div className="text-xs text-green-600">Published</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-2xl font-semibold text-yellow-600">
                      {filteredGallery.filter(i => i.status === 'draft').length}
                    </div>
                    <div className="text-xs text-yellow-600">Drafts</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-2xl font-semibold text-gray-600">
                      {filteredGallery.filter(i => i.status === 'archived').length}
                    </div>
                    <div className="text-xs text-gray-600">Archived</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-2xl font-semibold text-orange-600">
                      {filteredGallery.filter(i => i.featured).length}
                    </div>
                    <div className="text-xs text-orange-600">Featured</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <GalleryModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveImage}
          editingItem={editingItem}
        />
        <ConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={confirmDelete}
          title="Delete Gallery Image"
          message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
        />
      </div>
    </AdminLayout>
  );
}
