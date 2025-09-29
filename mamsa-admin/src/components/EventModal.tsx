'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface EventItem {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  featured_image?: string;
  capacity?: number;
  registration_required: boolean;
  registration_deadline?: string;
  organizer: string;
  contact_email?: string;
  contact_phone?: string;
  tags?: string[];
  created_at: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<EventItem, 'id' | 'created_at'>) => void;
  editingItem?: EventItem | null;
}

export default function EventModal({ isOpen, onClose, onSave, editingItem }: EventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    status: 'upcoming' as 'upcoming' | 'ongoing' | 'completed' | 'cancelled',
    featured_image: '',
    capacity: 0,
    registration_required: false,
    registration_deadline: '',
    organizer: '',
    contact_email: '',
    contact_phone: '',
    tags: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title,
        description: editingItem.description,
        date: editingItem.date,
        time: editingItem.time,
        location: editingItem.location,
        status: editingItem.status,
        featured_image: editingItem.featured_image || '',
        capacity: editingItem.capacity || 0,
        registration_required: editingItem.registration_required,
        registration_deadline: editingItem.registration_deadline || '',
        organizer: editingItem.organizer,
        contact_email: editingItem.contact_email || '',
        contact_phone: editingItem.contact_phone || '',
        tags: editingItem.tags || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        status: 'upcoming',
        featured_image: '',
        capacity: 0,
        registration_required: false,
        registration_deadline: '',
        organizer: '',
        contact_email: '',
        contact_phone: '',
        tags: []
      });
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      status: 'upcoming',
      featured_image: '',
      capacity: 0,
      registration_required: false,
      registration_deadline: '',
      organizer: '',
      contact_email: '',
      contact_phone: '',
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {editingItem ? 'Edit Event' : 'Create New Event'}
              </h3>
              <p className="text-sm text-gray-500">
                {editingItem ? 'Update event details and settings' : 'Plan and schedule a new event'}
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
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Enter event title..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.title.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Description *
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-y"
                  placeholder="Describe the event..."
                />
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                  <span>Provide details about the event</span>
                  <span>{formData.description.length} chars</span>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    id="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    id="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Event location or venue..."
                />
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
                      className="block w-full text-xs text-gray-600 border border-dashed border-gray-300 rounded-md p-2 hover:border-green-400 transition-colors cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-md p-4 text-center hover:border-green-400 transition-colors">
                    <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="mt-1">
                      <label htmlFor="featured_image" className="cursor-pointer">
                        <span className="text-xs font-medium text-green-600 hover:text-green-500">
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
              {/* Event Status */}
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <h4 className="text-xs font-semibold text-green-900 mb-2">
                  Event Status
                </h4>
                <select
                  name="status"
                  id="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="block w-full border border-green-200 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="upcoming">📅 Upcoming</option>
                  <option value="ongoing">🟢 Ongoing</option>
                  <option value="completed">✅ Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
                <p className="mt-1 text-xs text-green-700">
                  {formData.status === 'upcoming' && 'Event is scheduled'}
                  {formData.status === 'ongoing' && 'Event is currently happening'}
                  {formData.status === 'completed' && 'Event has finished'}
                  {formData.status === 'cancelled' && 'Event has been cancelled'}
                </p>
              </div>

              {/* Organizer */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label htmlFor="organizer" className="block text-xs font-medium text-gray-700 mb-2">
                  Organizer *
                </label>
                <input
                  type="text"
                  name="organizer"
                  id="organizer"
                  value={formData.organizer}
                  onChange={handleInputChange}
                  required
                  className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  placeholder="Event organizer..."
                />
              </div>

              {/* Capacity */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label htmlFor="capacity" className="block text-xs font-medium text-gray-700 mb-2">
                  Capacity
                </label>
                <input
                  type="number"
                  name="capacity"
                  id="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  min="0"
                  className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  placeholder="Max attendees..."
                />
                <p className="mt-1 text-xs text-gray-500">0 = unlimited</p>
              </div>

              {/* Registration */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <label className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    name="registration_required"
                    checked={formData.registration_required}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-xs font-medium text-gray-700">Registration Required</span>
                </label>
                {formData.registration_required && (
                  <input
                    type="datetime-local"
                    name="registration_deadline"
                    value={formData.registration_deadline}
                    onChange={handleInputChange}
                    className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                )}
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Contact Info</h4>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  placeholder="Contact email..."
                />
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  placeholder="Contact phone..."
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
                    className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    placeholder="Add tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors"
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
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded hover:bg-green-200 transition-colors"
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

              {/* Event Preview */}
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
                    {formData.title || 'Event Title'}
                  </h5>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {formData.description?.substring(0, 80) || 'Event description...'}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {formData.date ? new Date(formData.date).toLocaleDateString() : 'Date'}
                    </span>
                    <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                      formData.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                      formData.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                      formData.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {formData.status}
                    </span>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-xs bg-green-50 text-green-700 px-1 py-0.5 rounded">
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
              {formData.title && formData.description && formData.date && formData.time && formData.location && formData.organizer ? (
                <span className="text-green-600 font-medium">✓ Ready to create</span>
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
                disabled={loading || !formData.title || !formData.description || !formData.date || !formData.time || !formData.location || !formData.organizer}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
