import { createServerClient } from '@/lib/supabase-server';

const SUPABASE_TIMEOUT_MS = Number(process.env.SUPABASE_TIMEOUT_MS ?? '15000');

const createTimeoutController = (label: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);

  return {
    controller,
    clear: () => clearTimeout(timeoutId),
    label,
  };
};

const buildUnavailableError = (message: string) => new Error(`[Supabase] ${message}`);

export const ABOUT_SECTIONS = ['history', 'mission', 'vision', 'values', 'objectives'] as const;
export type AboutSectionKey = typeof ABOUT_SECTIONS[number];
export type AboutSnapshot = Record<AboutSectionKey, string>;

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

export type NotableAlumnus = {
  id: number;
  full_name: string;
  graduation_year: number | null;
  biography: string | null;
  achievements: string | null;
  current_position: string | null;
  organization: string | null;
  specialty: string | null;
  image_url: string | null;
  profile_links: {
    linkedin?: string | null;
    twitter?: string | null;
    website?: string | null;
  } | null;
  featured: boolean | null;
  order_position: number | null;
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
  about: AboutSnapshot;
  hasError: boolean;
};

export async function fetchPublishedNews(limit?: number) {
  const supabase = await createServerClient();

  if (!supabase) {
    return { data: [] as NewsArticle[], error: buildUnavailableError('Client unavailable while fetching news.') };
  }

  const timeout = createTimeoutController('news');

  try {
    let query = supabase
      .from('news_articles')
      .select('id, title, excerpt, featured_image, published_at, author, content')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query.abortSignal(timeout.controller.signal);
    return { data: data ?? [], error };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        data: [] as NewsArticle[],
        error: buildUnavailableError(`Timed out fetching published news (>${SUPABASE_TIMEOUT_MS}ms).`),
      };
    }
    return { data: [] as NewsArticle[], error: error as Error };
  } finally {
    timeout.clear();
  }
}

export async function fetchPublishedNewsArticle(id: number) {
  const supabase = await createServerClient();

  if (!supabase) {
    return { data: null, error: buildUnavailableError('Client unavailable while fetching news article.') };
  }

  const timeout = createTimeoutController('news-article');

  try {
    const { data, error } = await supabase
      .from('news_articles')
      .select('id, title, content, excerpt, featured_image, published_at, author')
      .eq('status', 'published')
      .eq('id', id)
      .maybeSingle()
      .abortSignal(timeout.controller.signal);

    return { data: data ?? null, error };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        data: null,
        error: buildUnavailableError(`Timed out fetching news article (>${SUPABASE_TIMEOUT_MS}ms).`),
      };
    }
    return { data: null, error: error as Error };
  } finally {
    timeout.clear();
  }
}

export async function fetchActiveEvents(limit?: number) {
  const supabase = await createServerClient();

  if (!supabase) {
    return { data: [] as Event[], error: buildUnavailableError('Client unavailable while fetching events.') };
  }

  const timeout = createTimeoutController('events');

  try {
    let query = supabase
      .from('events')
      .select('id, title, description, date, time, location, status, featured_image, organizer, contact_email')
      .in('status', ['upcoming', 'ongoing'])
      .order('date', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query.abortSignal(timeout.controller.signal);
    return { data: data ?? [], error };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { data: [] as Event[], error: buildUnavailableError(`Timed out fetching events (>${SUPABASE_TIMEOUT_MS}ms).`) };
    }
    return { data: [] as Event[], error: error as Error };
  } finally {
    timeout.clear();
  }
}

export async function fetchLeadership(limit?: number) {
  const supabase = await createServerClient();

  if (!supabase) {
    return { data: [] as Leader[], error: buildUnavailableError('Client unavailable while fetching leadership.') };
  }

  const timeout = createTimeoutController('leadership');

  try {
    let query = supabase
      .from('leadership')
      .select('id, name, position, bio, image_url, department, email, phone')
      .eq('status', 'active')
      .order('order_position', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query.abortSignal(timeout.controller.signal);
    return { data: data ?? [], error };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        data: [] as Leader[],
        error: buildUnavailableError(`Timed out fetching leadership (>${SUPABASE_TIMEOUT_MS}ms).`),
      };
    }
    return { data: [] as Leader[], error: error as Error };
  } finally {
    timeout.clear();
  }
}

export async function fetchPublishedGallery(limit?: number) {
  const supabase = await createServerClient();

  if (!supabase) {
    return { data: [] as GalleryImage[], error: buildUnavailableError('Client unavailable while fetching gallery.') };
  }

  const timeout = createTimeoutController('gallery');

  try {
    let query = supabase
      .from('gallery')
      .select('id, title, image_url, category, description, featured')
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query.abortSignal(timeout.controller.signal);
    return { data: data ?? [], error };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        data: [] as GalleryImage[],
        error: buildUnavailableError(`Timed out fetching gallery (>${SUPABASE_TIMEOUT_MS}ms).`),
      };
    }
    return { data: [] as GalleryImage[], error: error as Error };
  } finally {
    timeout.clear();
  }
}

export async function fetchPublishedAlumni(limit?: number) {
  const supabase = await createServerClient();

  if (!supabase) {
    return { data: [] as NotableAlumnus[], error: buildUnavailableError('Client unavailable while fetching alumni.') };
  }

  const timeout = createTimeoutController('alumni');

  try {
    let query = supabase
      .from('notable_alumni')
      .select(
        'id, full_name, graduation_year, biography, achievements, current_position, organization, specialty, image_url, profile_links, featured, order_position'
      )
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('order_position', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query.abortSignal(timeout.controller.signal);
    return { data: (data as NotableAlumnus[]) ?? [], error };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        data: [] as NotableAlumnus[],
        error: buildUnavailableError(`Timed out fetching notable alumni (>${SUPABASE_TIMEOUT_MS}ms).`),
      };
    }
    return { data: [] as NotableAlumnus[], error: error as Error };
  } finally {
    timeout.clear();
  }
}

export async function fetchAboutSnapshot() {
  const supabase = await createServerClient();

  const draft: AboutSnapshot = ABOUT_SECTIONS.reduce((acc, key) => {
    acc[key] = '';
    return acc;
  }, {} as AboutSnapshot);

  if (!supabase) {
    return { data: draft, error: buildUnavailableError('Client unavailable while fetching about snapshot.') };
  }

  const timeout = createTimeoutController('about');

  try {
    const { data, error } = await supabase
      .from('about')
      .select('section, content')
      .abortSignal(timeout.controller.signal);

    if (error) {
      return { data: draft, error };
    }

    data?.forEach((row: { section: string; content: string }) => {
      const key = row.section as AboutSectionKey;
      if (ABOUT_SECTIONS.includes(key)) {
        draft[key] = row.content ?? '';
      }
    });

    return { data: draft, error: null };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { data: draft, error: buildUnavailableError(`Timed out fetching about snapshot (>${SUPABASE_TIMEOUT_MS}ms).`) };
    }
    return { data: draft, error: error as Error };
  } finally {
    timeout.clear();
  }
}

export async function fetchHomeContent(): Promise<HomeContent> {
  const [newsResult, eventsResult, leadershipResult, galleryResult, aboutResult] = await Promise.all([
    fetchPublishedNews(3),
    fetchActiveEvents(), // Remove limit to fetch ALL upcoming and ongoing events
    fetchLeadership(4),
    fetchPublishedGallery(6),
    fetchAboutSnapshot(),
  ]);

  const hasError = Boolean(
    newsResult.error || eventsResult.error || leadershipResult.error || galleryResult.error || aboutResult.error
  );

  return {
    news: newsResult.data,
    events: eventsResult.data,
    leadership: leadershipResult.data,
    gallery: galleryResult.data,
    about: aboutResult.data,
    hasError,
  };
}

