'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AdminLayout from '@/components/AdminLayout';
import NewsModal from '@/components/NewsModal';
import ConfirmModal from '@/components/ConfirmModal';

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

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<NewsItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
    loadNews();
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

  const loadNews = async () => {
    try {
      // Static data for demonstration
      const staticNews: NewsItem[] = [
        {
          id: 1,
          title: "MAMSA Annual Conference 2024: A Resounding Success",
          content: "The MAMSA Annual Conference 2024 was held last weekend at the Makerere University Main Hall, bringing together over 500 students from various departments. The conference featured keynote speeches from industry leaders, panel discussions on current issues, and networking opportunities for students.\n\nThe theme 'Building Tomorrow's Leaders Today' resonated throughout the event, with speakers emphasizing the importance of student leadership and community engagement. Highlights included a presentation on sustainable development goals and a workshop on digital literacy in education.",
          author: "Dr. Sarah Johnson",
          published_at: "2024-03-15T10:00:00Z",
          created_at: "2024-03-15T09:00:00Z",
          status: "published",
          featured_image: "/api/placeholder/400/200",
          excerpt: "Over 500 students attended the successful MAMSA Annual Conference 2024, featuring leadership development and networking opportunities.",
          tags: ["conference", "leadership", "networking", "2024"]
        },
        {
          id: 2,
          title: "New Student Support Services Launch",
          content: "MAMSA is excited to announce the launch of new student support services designed to help members throughout their academic journey. These services include academic tutoring, career counseling, mental health support, and financial aid guidance.\n\nThe services are available to all registered MAMSA members and can be accessed through our online portal or by visiting the MAMSA office. We encourage all students to take advantage of these resources to enhance their university experience.",
          author: "John Mwesigwa",
          published_at: "2024-03-10T14:30:00Z",
          created_at: "2024-03-10T14:00:00Z",
          status: "published",
          featured_image: "/api/placeholder/400/200",
          excerpt: "New comprehensive student support services are now available to all MAMSA members.",
          tags: ["services", "support", "students", "announcement"]
        },
        {
          id: 3,
          title: "Upcoming Leadership Workshop Series",
          content: "Join us for our upcoming Leadership Workshop Series starting next month. This comprehensive program is designed to develop essential leadership skills for students.\n\nWorkshop topics include:\n• Effective Communication\n• Team Building and Management\n• Decision Making and Problem Solving\n• Public Speaking and Presentation Skills\n• Conflict Resolution\n\nRegistration is now open and spaces are limited. Don't miss this opportunity to develop your leadership potential.",
          author: "Mary Nakato",
          published_at: "2024-03-05T11:15:00Z",
          created_at: "2024-03-05T11:00:00Z",
          status: "published",
          featured_image: "/api/placeholder/400/200",
          excerpt: "Register now for the comprehensive Leadership Workshop Series starting next month.",
          tags: ["workshop", "leadership", "training", "registration"]
        },
        {
          id: 4,
          title: "Draft: Community Outreach Program Update",
          content: "This is a draft article about our community outreach program. We are working on expanding our community engagement initiatives to include more volunteer opportunities and partnerships with local organizations.\n\nThe program aims to connect students with meaningful community service opportunities while developing practical skills and making a positive impact in our communities.",
          author: "David Kato",
          published_at: "",
          created_at: "2024-03-12T16:45:00Z",
          status: "draft",
          excerpt: "Draft article about expanding community outreach programs and volunteer opportunities.",
          tags: ["community", "outreach", "volunteer", "draft"]
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setNews(staticNews);
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNews = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEditNews = (item: NewsItem) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDeleteNews = (item: NewsItem) => {
    setItemToDelete(item);
    setShowConfirm(true);
  };

  const handleSaveNews = async (newsData: Omit<NewsItem, 'id' | 'created_at'>) => {
    try {
      if (editingItem) {
        // Update existing item
        const updatedItem: NewsItem = {
          ...editingItem,
          ...newsData,
          published_at: newsData.status === 'published' ? new Date().toISOString() : editingItem.published_at
        };
        setNews(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item));
      } else {
        // Create new item
        const newItem: NewsItem = {
          id: Date.now(), // Simple ID generation for demo
          ...newsData,
          created_at: new Date().toISOString(),
          published_at: newsData.status === 'published' ? new Date().toISOString() : ''
        };
        setNews(prev => [newItem, ...prev]);
      }
    } catch (error) {
      console.error('Failed to save news:', error);
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        setNews(prev => prev.filter(item => item.id !== itemToDelete.id));
        setShowConfirm(false);
        setItemToDelete(null);
      } catch (error) {
        console.error('Failed to delete news:', error);
      }
    }
  };

  const handleBulkDelete = async () => {
    try {
      setNews(prev => prev.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
    } catch (error) {
      console.error('Failed to delete selected items:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredNews.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredNews.map(item => item.id));
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  // Filter news based on search and status
  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout user={user}>
      <div className="w-full">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-medium text-gray-900">News Articles</h2>
              <button 
                onClick={handleCreateNews}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
              >
                Add New Article
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'published' | 'archived')}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">
                    {selectedItems.length} item(s) selected
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleBulkDelete}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete Selected
                    </button>
                  </div>
                </div>
              </div>
            )}

            {news.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No news articles</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new article.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Select All */}
                <div className="flex items-center space-x-3 pb-2 border-b border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredNews.length && filteredNews.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-500">Select all ({filteredNews.length} items)</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredNews.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                              {item.excerpt || item.content}
                            </p>
                            
                            {/* Tags */}
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            <div className="mt-2 flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-1 sm:gap-2">
                              <span>By {item.author}</span>
                              <span className="hidden sm:inline">•</span>
                              <span>{new Date(item.created_at).toLocaleDateString()}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                                {item.status}
                              </span>
                            </div>
                          </div>
                          
                          {/* Featured Image */}
                          {item.featured_image && (
                            <div className="ml-4 flex-shrink-0">
                              <img
                                src={item.featured_image}
                                alt="Featured"
                                className="h-16 w-16 object-cover rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 lg:ml-4">
                        <button 
                          onClick={() => handleEditNews(item)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteNews(item)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
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
          </div>
        </div>

        {/* News Modal */}
        <NewsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveNews}
          editingItem={editingItem}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={confirmDelete}
          title="Delete Article"
          message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
        />
      </div>
    </AdminLayout>
  );
}
