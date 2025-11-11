import { createServerClient } from '@/lib/supabase-server';

export type NewsArticle = {
  id: number;
  title: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  author: string | null;
  content?: string | null;
};

export type Event = {
  id: number;
  title: string;
  description: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  status: string | null;
  featured_image: string | null;
  organizer?: string | null;
  contact_email?: string | null;
};

export type Leader = {
  id: number;
  name: string;
  position: string | null;
  bio: string | null;
  image_url: string | null;
  department: string | null;
  email?: string | null;
  phone?: string | null;
};

export type GalleryImage = {
  id: number;
  title: string;
  image_url: string | null;
  category: string | null;
  description: string | null;
  featured: boolean | null;
};

export type HomeContent = {
  news: NewsArticle[];
  events: Event[];
  leadership: Leader[];
  gallery: GalleryImage[];
  hasError: boolean;
};

export const formatDate = (value?: string | null) => {
  if (!value) return 'To be announced';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export async function fetchPublishedNews(limit?: number) {
  const supabase = await createServerClient();
  let query = supabase
    .from('news_articles')
    .select('id, title, excerpt, featured_image, published_at, author, content')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function fetchActiveEvents(limit?: number) {
  const supabase = await createServerClient();
  let query = supabase
    .from('events')
    .select('id, title, description, date, time, location, status, featured_image, organizer, contact_email')
    .in('status', ['upcoming', 'ongoing'])
    .order('date', { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function fetchLeadership(limit?: number) {
  const supabase = await createServerClient();
  let query = supabase
    .from('leadership_members')
    .select('id, name, position, bio, image_url, department, email, phone')
    .eq('status', 'active')
    .order('order_position', { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function fetchPublishedGallery(limit?: number) {
  const supabase = await createServerClient();
  let query = supabase
    .from('gallery_images')
    .select('id, title, image_url, category, description, featured')
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function fetchHomeContent(): Promise<HomeContent> {
  const [newsResult, eventsResult, leadershipResult, galleryResult] = await Promise.all([
    fetchPublishedNews(3),
    fetchActiveEvents(3),
    fetchLeadership(4),
    fetchPublishedGallery(6),
  ]);

  const hasError = Boolean(
    newsResult.error || eventsResult.error || leadershipResult.error || galleryResult.error
  );

  return {
    news: newsResult.data,
    events: eventsResult.data,
    leadership: leadershipResult.data,
    gallery: galleryResult.data,
    hasError,
  };
}

