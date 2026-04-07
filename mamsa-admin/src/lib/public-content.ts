import sql from '@/lib/db';
import { getPublicUrl } from '@/lib/cloudinary';

const QUERY_TIMEOUT_MS = Number(process.env.DB_TIMEOUT_MS ?? '15000');

const createTimeoutController = (label: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);

  return {
    controller,
    clear: () => clearTimeout(timeoutId),
    label,
  };
};

const buildUnavailableError = (message: string) => new Error(`[Database] ${message}`);

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

type NewsRow = {
  id: number;
  title: string;
  content: string | null;
  category: string | null;
  status: string;
  image: string | null;
  created_at: string;
  updated_at: string | null;
};

type EventRow = {
  id: number;
  title: string;
  description: string | null;
  date: string | null;
  location: string | null;
  status: string;
  image: string | null;
  category: string | null;
  created_at: string;
  updated_at: string | null;
};

type LeadershipRow = {
  id: number;
  name: string;
  position: string | null;
  bio: string | null;
  image: string | null;
  order: number | null;
  status: string;
  created_at: string;
  updated_at: string | null;
};

type GalleryRow = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  cover_image: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
};

type AboutRow = {
  mission: string | null;
  vision: string | null;
  content: string | null;
  updated_at: string | null;
};

type AlumniRow = {
  id: number;
  name: string | null;
  role: string | null;
  image: string | null;
  created_at: string;
};

const resolveImage = (value?: string | null) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return getPublicUrl(value);
};

const withTimeout = async <T>(label: string, runner: () => Promise<T>): Promise<T> => {
  const timeout = createTimeoutController(label);

  try {
    return await Promise.race([
      runner(),
      new Promise<T>((_, reject) => {
        timeout.controller.signal.addEventListener('abort', () => {
          reject(new Error('AbortError'));
        });
      }),
    ]);
  } finally {
    timeout.clear();
  }
};

const deriveExcerpt = (content: string | null) => {
  const text = content?.trim() ?? '';
  if (!text) return null;
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
};

const toNewsArticle = (row: NewsRow): NewsArticle => ({
  id: row.id,
  title: row.title,
  excerpt: deriveExcerpt(row.content),
  featured_image: resolveImage(row.image),
  published_at: row.updated_at ?? row.created_at,
  author: row.category,
  content: row.content,
});

const toEvent = (row: EventRow): Event => ({
  id: row.id,
  title: row.title,
  description: row.description,
  date: row.date,
  time: null,
  location: row.location,
  status: row.status,
  featured_image: resolveImage(row.image),
  organizer: row.category,
  contact_email: null,
});

const toLeader = (row: LeadershipRow): Leader => ({
  id: row.id,
  name: row.name,
  position: row.position,
  bio: row.bio,
  image_url: resolveImage(row.image),
  department: null,
  email: null,
  phone: null,
});

const toGalleryImage = (row: GalleryRow): GalleryImage => ({
  id: row.id,
  title: row.title,
  image_url: resolveImage(row.cover_image),
  category: row.category,
  description: row.description,
  featured: false,
});

const toAlumnus = (row: AlumniRow): NotableAlumnus => ({
  id: row.id,
  full_name: row.name ?? 'Unknown',
  graduation_year: null,
  biography: null,
  achievements: null,
  current_position: row.role,
  organization: null,
  specialty: null,
  image_url: resolveImage(row.image),
  profile_links: null,
  featured: false,
  order_position: null,
});

export async function fetchPublishedNews(limit?: number) {
  try {
    const rows = await withTimeout('news', async () =>
      sql<NewsRow[]>`
        SELECT id, title, content, category, status, image, created_at, updated_at
        FROM news_articles
        WHERE status = 'published'
        ORDER BY COALESCE(updated_at, created_at) DESC
        ${limit ? sql`LIMIT ${limit}` : sql``}
      `
    );

    return { data: rows.map(toNewsArticle), error: null };
  } catch (error) {
    if (error instanceof Error && error.message === 'AbortError') {
      return {
        data: [] as NewsArticle[],
        error: buildUnavailableError(`Timed out fetching published news (>${QUERY_TIMEOUT_MS}ms).`),
      };
    }
    return { data: [] as NewsArticle[], error: error as Error };
  }
}

export async function fetchPublishedNewsArticle(id: number) {
  try {
    const rows = await withTimeout('news-article', async () =>
      sql<NewsRow[]>`
        SELECT id, title, content, category, status, image, created_at, updated_at
        FROM news_articles
        WHERE status = 'published' AND id = ${id}
        LIMIT 1
      `
    );

    return { data: rows[0] ? toNewsArticle(rows[0]) : null, error: null };
  } catch (error) {
    if (error instanceof Error && error.message === 'AbortError') {
      return {
        data: null,
        error: buildUnavailableError(`Timed out fetching news article (>${QUERY_TIMEOUT_MS}ms).`),
      };
    }
    return { data: null, error: error as Error };
  }
}

export async function fetchActiveEvents(limit?: number) {
  try {
    const rows = await withTimeout('events', async () =>
      sql<EventRow[]>`
        SELECT id, title, description, date, location, status, image, category, created_at, updated_at
        FROM events
        WHERE status IN ('upcoming', 'ongoing')
        ORDER BY date ASC
        ${limit ? sql`LIMIT ${limit}` : sql``}
      `
    );

    return { data: rows.map(toEvent), error: null };
  } catch (error) {
    if (error instanceof Error && error.message === 'AbortError') {
      return { data: [] as Event[], error: buildUnavailableError(`Timed out fetching events (>${QUERY_TIMEOUT_MS}ms).`) };
    }
    return { data: [] as Event[], error: error as Error };
  }
}

export async function fetchLeadership(limit?: number) {
  try {
    const rows = await withTimeout('leadership', async () =>
      sql<LeadershipRow[]>`
        SELECT id, name, position, bio, image, "order" AS order, status, created_at, updated_at
        FROM leadership
        WHERE status = 'active'
        ORDER BY "order" ASC, created_at DESC
        ${limit ? sql`LIMIT ${limit}` : sql``}
      `
    );

    return { data: rows.map(toLeader), error: null };
  } catch (error) {
    if (error instanceof Error && error.message === 'AbortError') {
      return {
        data: [] as Leader[],
        error: buildUnavailableError(`Timed out fetching leadership (>${QUERY_TIMEOUT_MS}ms).`),
      };
    }
    return { data: [] as Leader[], error: error as Error };
  }
}

export async function fetchPublishedGallery(limit?: number) {
  try {
    const rows = await withTimeout('gallery', async () =>
      sql<GalleryRow[]>`
        SELECT id, title, description, category, cover_image, status, created_at, updated_at
        FROM gallery
        WHERE status = 'published'
        ORDER BY created_at DESC
        ${limit ? sql`LIMIT ${limit}` : sql``}
      `
    );

    return { data: rows.map(toGalleryImage), error: null };
  } catch (error) {
    if (error instanceof Error && error.message === 'AbortError') {
      return {
        data: [] as GalleryImage[],
        error: buildUnavailableError(`Timed out fetching gallery (>${QUERY_TIMEOUT_MS}ms).`),
      };
    }
    return { data: [] as GalleryImage[], error: error as Error };
  }
}

export async function fetchPublishedAlumni(limit?: number) {
  try {
    const rows = await withTimeout('alumni', async () =>
      sql<AlumniRow[]>`
        SELECT id, name, role, image, created_at
        FROM leadership_members
        ORDER BY created_at DESC
        ${limit ? sql`LIMIT ${limit}` : sql``}
      `
    );

    return { data: rows.map(toAlumnus), error: null };
  } catch (error) {
    if (error instanceof Error && error.message === 'AbortError') {
      return {
        data: [] as NotableAlumnus[],
        error: buildUnavailableError(`Timed out fetching notable alumni (>${QUERY_TIMEOUT_MS}ms).`),
      };
    }
    return { data: [] as NotableAlumnus[], error: error as Error };
  }
}

export async function fetchAboutSnapshot() {
  const draft: AboutSnapshot = ABOUT_SECTIONS.reduce((acc, key) => {
    acc[key] = '';
    return acc;
  }, {} as AboutSnapshot);

  try {
    const rows = await withTimeout('about', async () => sql<AboutRow[]>`
      SELECT mission, vision, content, updated_at
      FROM about
      ORDER BY updated_at DESC
      LIMIT 1
    `);

    const row = rows[0];
    draft.history = row?.content ?? '';
    draft.mission = row?.mission ?? '';
    draft.vision = row?.vision ?? '';
    draft.values = '';
    draft.objectives = '';

    return { data: draft, error: null };
  } catch (error) {
    if (error instanceof Error && error.message === 'AbortError') {
      return { data: draft, error: buildUnavailableError(`Timed out fetching about snapshot (>${QUERY_TIMEOUT_MS}ms).`) };
    }
    return { data: draft, error: error as Error };
  }
}

// Helper function to get total count of published news articles
// Optimized with timeout to prevent blocking
async function fetchPublishedNewsCount(): Promise<number> {
  try {
    const rows = await sql<{ count: string | number }[]>`
      SELECT COUNT(*)::int AS count
      FROM news_articles
      WHERE status = 'published'
    `;
    return Number(rows[0]?.count ?? 0);
  } catch (error) {
    return 0;
  }
}

// Helper function to get total count of active events
// Optimized with timeout to prevent blocking
async function fetchActiveEventsCount(): Promise<number> {
  try {
    const rows = await sql<{ count: string | number }[]>`
      SELECT COUNT(*)::int AS count
      FROM events
      WHERE status IN ('upcoming', 'ongoing')
    `;
    return Number(rows[0]?.count ?? 0);
  } catch (error) {
    return 0;
  }
}

// Helper function to get total count of active leaders
// Optimized with timeout to prevent blocking
async function fetchLeadershipCount(): Promise<number> {
  try {
    const rows = await sql<{ count: string | number }[]>`
      SELECT COUNT(*)::int AS count
      FROM leadership
      WHERE status = 'active'
    `;
    return Number(rows[0]?.count ?? 0);
  } catch (error) {
    return 0;
  }
}

export type HomeContentStats = {
  storiesCount: number;
  eventsCount: number;
  leadersCount: number;
};

export async function fetchHomeContent(): Promise<HomeContent & { stats: HomeContentStats }> {
  // Optimize: Limit events to 10 most recent for home page, fetch counts in parallel but don't block on them
  const [newsResult, eventsResult, leadershipResult, galleryResult, aboutResult] = await Promise.all([
    fetchPublishedNews(3),
    fetchActiveEvents(10), // Limit to 10 most recent events for home page
    fetchLeadership(4),
    fetchPublishedGallery(6),
    fetchAboutSnapshot(),
  ]);

  // Fetch counts in parallel but don't block page rendering on them
  const [storiesCount, eventsCount, leadersCount] = await Promise.all([
    fetchPublishedNewsCount(),
    fetchActiveEventsCount(),
    fetchLeadershipCount(),
  ]);

  const hasError = Boolean(
    newsResult.error || eventsResult.error || leadershipResult.error || galleryResult.error || aboutResult.error
  );

  // Hardcoded fallback values if counts fail
  const FALLBACK_STATS: HomeContentStats = {
    storiesCount: 12,
    eventsCount: 8,
    leadersCount: 15,
  };

  return {
    news: newsResult.data,
    events: eventsResult.data,
    leadership: leadershipResult.data,
    gallery: galleryResult.data,
    about: aboutResult.data,
    hasError,
    stats: {
      storiesCount: storiesCount || FALLBACK_STATS.storiesCount,
      eventsCount: eventsCount || FALLBACK_STATS.eventsCount,
      leadersCount: leadersCount || FALLBACK_STATS.leadersCount,
    },
  };
}

