'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import AdminLayout from '@/components/AdminLayout';
import AdminLoadingState from '@/components/AdminLoadingState';
import NewsModal from '@/components/NewsModal';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

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

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: NewsItem;
  old?: { id: number };
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<NewsItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  const supabase = createClient();
  const { toast, showToast, hideToast } = useToast();

  // Function to seed initial news data
  const seedInitialNews = useCallback(async () => {
    try {
      console.log('Seeding initial news data...');
      
      const initialNews = [
        {
          title: "Welcome to MAMSA News Portal",
          content: "Welcome to the MAMSA News Portal! This is your central hub for all the latest updates, announcements, and news from the Madi Makerere University Students Association.\n\nHere you'll find information about upcoming events, leadership updates, community initiatives, and much more. We're committed to keeping you informed and engaged with all the exciting developments happening within our community.",
          author: "MAMSA Editorial Team",
          status: "published",
          featured_image: "/api/placeholder/400/200",
          excerpt: "Welcome to the MAMSA News Portal - your central hub for all the latest updates and announcements.",
          tags: ["welcome", "announcement", "portal"],
          created_by: user?.id
        },
        {
          title: "Getting Started with MAMSA",
          content: "New to MAMSA? Here's everything you need to know to get started and make the most of your membership.\n\nMAMSA offers numerous opportunities for personal and professional development, networking, and community engagement. From academic support to leadership development programs, we're here to help you succeed throughout your university journey.\n\nMake sure to check out our upcoming events and consider joining one of our many committees or interest groups.",
          author: "MAMSA Admin",
          status: "published",
          featured_image: "/api/placeholder/400/200",
          excerpt: "Everything you need to know to get started with MAMSA and make the most of your membership.",
          tags: ["getting-started", "membership", "guide"],
          created_by: user?.id
        }
      ];

      const { data, error } = await supabase
        .from('news_articles')
        .insert(initialNews)
        .select();

      if (error) {
        console.error('Error seeding initial news:', error);
        return;
      }

      console.log('Successfully seeded initial news data:', data);
      // Only set news if we don't already have data
      setNews(prev => prev.length > 0 ? prev : data);
    } catch (error) {
      console.error('Failed to seed initial news:', error);
    }
  }, [user?.id, supabase]);

  const checkAuth = useCallback(async () => {
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
  }, [supabase]);

  const loadNews = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading news from database...');

      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading news:', error);
        
        // If table doesn't exist or has issues, fall back to static data
        console.log('Falling back to static data...');
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
          }
        ];
        setNews(staticNews);
        return;
      }

      if (data && data.length > 0) {
        console.log('Loaded news from database:', data.length, 'articles');
        setNews(data);
      } else {
        console.log('No news articles found in database');
        setNews([]);
        
        // Optionally seed some initial data
        await seedInitialNews();
      }
    } catch (error) {
      console.error('Failed to load news:', error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, seedInitialNews]);

  useEffect(() => {
    checkAuth();
    loadNews();
  }, [checkAuth, loadNews]);

  // Set up real-time subscription for news articles
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('news_articles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news_articles'
        },
        (payload: RealtimePayload) => {
          console.log('News articles change received:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            setNews(prev => {
              // Check if item already exists to prevent duplicates
              const exists = prev.some(item => item.id === payload.new!.id);
              if (!exists) {
                return [payload.new as NewsItem, ...prev];
              }
              return prev;
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setNews(prev => prev.map(item => 
              item.id === payload.new!.id ? payload.new as NewsItem : item
            ));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setNews(prev => prev.filter(item => item.id !== payload.old!.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

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
      console.log('Saving news article:', newsData);
      
      if (editingItem) {
        // Update existing item
        console.log('Updating existing article with ID:', editingItem.id);
        
        const updateData = {
          title: newsData.title,
          content: newsData.content,
          author: newsData.author,
          status: newsData.status,
          featured_image: newsData.featured_image,
          excerpt: newsData.excerpt,
          tags: newsData.tags,
          published_at: newsData.status === 'published' ? new Date().toISOString() : editingItem.published_at,
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('news_articles')
          .update(updateData)
          .eq('id', editingItem.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating news article:', error);
          showToast(`Failed to update news article: ${error.message}`, 'error');
          return;
        }

        if (!data) {
          console.error('No data returned from update operation');
          showToast('Failed to update news article: No data returned', 'error');
          return;
        }

        console.log('Successfully updated news article:', data);
        
        // Update local state
        setNews(prev => prev.map(item => item.id === editingItem.id ? data : item));
        showToast('News article updated successfully', 'success');
      } else {
        // Create new item
        console.log('Creating new article...');
        
        const insertData = {
          title: newsData.title,
          content: newsData.content,
          author: newsData.author,
          status: newsData.status,
          featured_image: newsData.featured_image,
          excerpt: newsData.excerpt,
          tags: newsData.tags,
          published_at: newsData.status === 'published' ? new Date().toISOString() : null,
          created_by: user?.id
        };

        const { data, error } = await supabase
          .from('news_articles')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('Error creating news article:', error);
          showToast(`Failed to create news article: ${error.message}`, 'error');
          return;
        }

        if (!data) {
          console.error('No data returned from create operation');
          showToast('Failed to create news article: No data returned', 'error');
          return;
        }

        console.log('Successfully created news article:', data);
        
        // Update local state
        setNews(prev => [data, ...prev]);
        showToast('News article created successfully', 'success');
      }
      
      console.log('Closing modal after successful operation');
      setShowModal(false);
      
      // Return success indicator
      return { success: true };
    } catch (error) {
      console.error('Failed to save news:', error);
      // Only show generic error if we haven't already shown a specific error
      if (error instanceof Error) {
        showToast(`Failed to save news article: ${error.message}`, 'error');
      } else {
        showToast('Failed to save news article. Please try again.', 'error');
      }
      
      // Return error indicator
      return { success: false, error };
    }
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        console.log('Deleting news article with ID:', itemToDelete.id);
        
        const { error } = await supabase
          .from('news_articles')
          .delete()
          .eq('id', itemToDelete.id);

        if (error) {
          console.error('Error deleting news article:', error);
          throw error;
        }

        console.log('Successfully deleted news article');
        
        // Update local state
        setNews(prev => prev.filter(item => item.id !== itemToDelete.id));
        setShowConfirm(false);
        setItemToDelete(null);
        showToast('News article deleted successfully', 'success');
      } catch (error) {
        console.error('Failed to delete news:', error);
        showToast('Failed to delete news article. Please try again.', 'error');
      }
    }
  };

  const handleBulkDelete = async () => {
    try {
      console.log('Bulk deleting news articles:', selectedItems);
      
      const { error } = await supabase
        .from('news_articles')
        .delete()
        .in('id', selectedItems);

      if (error) {
        console.error('Error bulk deleting news articles:', error);
        throw error;
      }

      console.log('Successfully bulk deleted news articles');
      
      // Update local state
      setNews(prev => prev.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
      showToast(`${selectedItems.length} article(s) deleted successfully`, 'success');
    } catch (error) {
      console.error('Failed to delete selected items:', error);
      showToast('Failed to delete selected articles. Please try again.', 'error');
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

  // Remove duplicates and filter news based on search and status
  const filteredNews = news
    .filter((item, index, self) => 
      // Remove duplicates based on id and title combination
      index === self.findIndex(t => t.id === item.id && t.title === item.title)
    )
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });


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

            {loading ? (
              <AdminLoadingState 
                message="Loading news articles..." 
                subMessage="Fetching the latest news and updates from the database"
              />
            ) : news.length === 0 ? (
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

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredNews.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="group bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                    {/* Article Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => handleSelectItem(item.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <h3 className="text-xl font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                              {item.title}
                            </h3>
                          </div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                            item.status === 'published' ? 'bg-green-100 text-green-800 border-green-200' :
                            item.status === 'draft' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {item.status === 'published' && '📰 Published'}
                            {item.status === 'draft' && '📝 Draft'}
                            {item.status === 'archived' && '📁 Archived'}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditNews(item)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Article"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteNews(item)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Article"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">
                        {item.excerpt || item.content}
                      </p>
                    </div>

                    {/* Featured Image Section */}
                    <div className="px-6 pb-4">
                      {item.featured_image ? (
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                          <img
                            src={item.featured_image}
                            alt={item.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              // Fallback for broken images
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                    <div class="text-center">
                                      <svg class="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <p class="text-xs text-gray-500">Image not available</p>
                                    </div>
                                  </div>
                                `;
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                          
                          {/* Image overlay with article info */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <div className="flex items-center justify-between">
                              <div className="text-white text-xs font-medium bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
                                Featured Article
                              </div>
                              {item.status === 'published' && (
                                <div className="text-white text-xs bg-green-500/80 px-2 py-1 rounded backdrop-blur-sm flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Published
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Placeholder for articles without featured images */
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 shadow-sm">
                          <div className="h-full w-full flex items-center justify-center">
                            <div className="text-center">
                              <svg className="mx-auto h-16 w-16 text-blue-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                              </svg>
                              <p className="text-sm font-medium text-blue-600 mb-1">News Article</p>
                              <p className="text-xs text-blue-500">No featured image</p>
                            </div>
                          </div>
                          
                          {/* Placeholder overlay */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <div className="flex items-center justify-between">
                              <div className="text-blue-600 text-xs font-medium bg-white/80 px-2 py-1 rounded backdrop-blur-sm">
                                {item.status === 'published' ? '📰 Published' : 
                                 item.status === 'draft' ? '📝 Draft' : '📁 Archived'}
                              </div>
                              <div className="text-blue-600 text-xs bg-white/80 px-2 py-1 rounded backdrop-blur-sm flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Article
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Article Meta Information */}
                    <div className="px-6 pb-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center mb-1">
                            <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Author</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.author}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center mb-1">
                            <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(item.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Article Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.published_at && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Published
                            </span>
                          )}
                          {!item.published_at && item.status === 'draft' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Draft
                            </span>
                          )}
                        </div>
                        
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                #{tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-700">
                                +{item.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                </div>

                {/* News Statistics */}
                {filteredNews.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">News Statistics</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-blue-700">
                              {filteredNews.filter(n => n.status === 'published').length}
                            </div>
                            <div className="text-sm font-medium text-blue-600">Published</div>
                          </div>
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-yellow-700">
                              {filteredNews.filter(n => n.status === 'draft').length}
                            </div>
                            <div className="text-sm font-medium text-yellow-600">Drafts</div>
                          </div>
                          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-gray-700">
                              {filteredNews.filter(n => n.status === 'archived').length}
                            </div>
                            <div className="text-sm font-medium text-gray-600">Archived</div>
                          </div>
                          <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293h9.172a1 1 0 00.707-.293l1.414-1.414A1 1 0 0018.414 4H19a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-green-700">
                              {filteredNews.length}
                            </div>
                            <div className="text-sm font-medium text-green-600">Total</div>
                          </div>
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      </div>
    </AdminLayout>
  );
}
