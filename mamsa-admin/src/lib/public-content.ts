import sql from '@/lib/db';
import { getPublicUrl } from '@/lib/cloudinary';

export const ABOUT_SECTIONS = ['history', 'mission', 'vision', 'values', 'objectives'] as const;
export type AboutSectionKey = typeof ABOUT_SECTIONS[number];
export type AboutSnapshot = Record<AboutSectionKey, string>;

export type NewsArticle = {
  id: number;
  title: string;
  content: string | null;
  category: string | null;
  date: string | null;
  author: string | null;
  status?: 'published' | 'draft' | 'archived' | null;
  featured_image: string | null;
  excerpt: string | null;
  published_at: string | null;
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
  organizer: string | null;
  contact_email?: string | null;
};

export type GalleryImage = {
  id: number;
  title: string;
  image_url: string | null;
  category: string | null;
  description: string | null;
  featured: boolean;
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
  status?: 'published' | 'draft' | 'archived' | null;
};

export type Service = {
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
  order: number | null;
  status: string | null;
};

export type ContactInfo = {
  id: number;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export type SettingsMap = Record<string, string>;

export type HomeContentStats = {
  storiesCount: number;
  eventsCount: number;
  leadersCount: number;
};

export type HomeContent = {
  news: NewsArticle[];
  events: Event[];
  leadership: Leader[];
  gallery: GalleryImage[];
  about: AboutSnapshot;
  hasError: boolean;
  stats: HomeContentStats;
};

const toImageUrl = (value?: string | null) =>
  value?.startsWith('http') ? value : value ? getPublicUrl(value) : null;

const deriveExcerpt = (content: string | null) => {
  const text = content?.trim() ?? '';
  if (!text) return null;
  return text.length > 180 ? `${text.slice(0, 177)}...` : text;
};

let newsColumnsCache: { hasStatus: boolean; hasFeaturedImage: boolean } | null = null;

async function getNewsColumnInfo() {
  if (newsColumnsCache) {
    return newsColumnsCache;
  }

  const rows = await sql<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'news'
      AND column_name IN ('status', 'featured_image')
  `;

  const names = new Set(rows.map((row) => row.column_name));
  newsColumnsCache = {
    hasStatus: names.has('status'),
    hasFeaturedImage: names.has('featured_image'),
  };

  return newsColumnsCache;
}

export async function getAbout() {
  const rows = await sql<{ id: number; section: string; content: string | null }[]>`
    SELECT id, section, content
    FROM about
    ORDER BY id ASC
  `;

  return rows;
}

export async function getNews(limit?: number) {
  const columns = await getNewsColumnInfo();

  const rows = columns.hasStatus
    ? await sql<{
        id: number;
        title: string;
        content: string | null;
        category: string | null;
        date: string | null;
        author: string | null;
        status: 'published' | 'draft' | 'archived' | null;
        featured_image: string | null;
        created_at: string;
        updated_at: string | null;
      }[]>`
        SELECT
          id,
          title,
          content,
          category,
          date,
          author,
          status,
          ${columns.hasFeaturedImage ? sql`featured_image` : sql`NULL::text AS featured_image`},
          created_at,
          updated_at
        FROM news
        WHERE status = 'published'
        ORDER BY COALESCE(updated_at, created_at) DESC
        ${limit ? sql`LIMIT ${limit}` : sql``}
      `
    : await sql<{
        id: number;
        title: string;
        content: string | null;
        category: string | null;
        date: string | null;
        author: string | null;
        featured_image: string | null;
        created_at: string;
        updated_at: string | null;
      }[]>`
        SELECT
          id,
          title,
          content,
          category,
          date,
          author,
          ${columns.hasFeaturedImage ? sql`featured_image` : sql`NULL::text AS featured_image`},
          created_at,
          updated_at
        FROM news
        ORDER BY COALESCE(updated_at, created_at) DESC
        ${limit ? sql`LIMIT ${limit}` : sql``}
      `;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    date: row.date,
    author: row.author,
    status: 'status' in row ? row.status : 'published',
    featured_image: toImageUrl(row.featured_image),
    excerpt: deriveExcerpt(row.content),
    published_at: row.updated_at ?? row.created_at,
  }));
}

export async function getEvents(limit?: number) {
  const rows = await sql<{
    id: number;
    title: string;
    description: string | null;
    date: string | null;
    time: string | null;
    location: string | null;
    status: string | null;
    featured_image: string | null;
    organizer: string | null;
  }[]>`
    SELECT id, title, description, date, time, location, status, featured_image, organizer
    FROM events
    WHERE status IN ('upcoming', 'ongoing')
    ORDER BY date ASC, time ASC
    ${limit ? sql`LIMIT ${limit}` : sql``}
  `;

  return rows.map((row) => ({
    ...row,
    featured_image: toImageUrl(row.featured_image),
    contact_email: null,
  }));
}

export async function getGallery(limit?: number) {
  const galleries = await sql<{
    id: number;
    title: string;
    description: string | null;
    category: string | null;
    cover_image: string | null;
    status: string;
  }[]>`
    SELECT id, title, description, category, cover_image, status
    FROM gallery
    WHERE status = 'active'
    ORDER BY created_at DESC
    ${limit ? sql`LIMIT ${limit}` : sql``}
  `;

  const images = await sql<{
    id: number;
    gallery_id: number;
    image: string | null;
    caption: string | null;
  }[]>`
    SELECT id, gallery_id, image, caption
    FROM gallery_images
    ORDER BY "order" ASC, created_at ASC
  `;

  const byGallery = new Map<number, Array<{ id: number; image: string | null; caption: string | null }>>();
  for (const image of images) {
    const list = byGallery.get(image.gallery_id) ?? [];
    list.push({ id: image.id, image: image.image, caption: image.caption });
    byGallery.set(image.gallery_id, list);
  }

  const result: GalleryImage[] = [];
  for (const gallery of galleries) {
    result.push({
      id: gallery.id,
      title: gallery.title,
      description: gallery.description,
      category: gallery.category,
      image_url: toImageUrl(gallery.cover_image),
      featured: false,
    });

    const related = byGallery.get(gallery.id) ?? [];
    for (const item of related) {
      result.push({
        id: item.id,
        title: item.caption || gallery.title,
        description: gallery.description,
        category: gallery.category,
        image_url: toImageUrl(item.image),
        featured: false,
      });
    }
  }

  return result;
}

export async function getLeadership(limit?: number) {
  const rows = await sql<{
    id: number;
    name: string;
    position: string | null;
    bio: string | null;
    image: string | null;
    status: string;
  }[]>`
    SELECT id, name, position, bio, image, status
    FROM leadership
    WHERE status = 'active'
    ORDER BY "order" ASC, created_at DESC
    ${limit ? sql`LIMIT ${limit}` : sql``}
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    position: row.position,
    bio: row.bio,
    image_url: toImageUrl(row.image),
    department: null,
    email: null,
    phone: null,
  }));
}

export async function getServices() {
  const rows = await sql<Service[]>`
    SELECT id, title, description, icon, "order", status
    FROM services
    WHERE status = 'active'
    ORDER BY "order" ASC, created_at ASC
  `;

  return rows.map((row) => ({
    ...row,
    icon: toImageUrl(row.icon),
  }));
}

export async function getContact() {
  const rows = await sql<ContactInfo[]>`
    SELECT id, phone, email, address
    FROM contact
    ORDER BY id DESC
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function getSettings() {
  const rows = await sql<{ key: string; value: string | null }[]>`
    SELECT key, value
    FROM settings
    ORDER BY key ASC
  `;

  return rows.reduce<SettingsMap>((acc, row) => {
    acc[row.key] = row.value ?? '';
    return acc;
  }, {});
}

export async function fetchPublishedNews(limit?: number) {
  try {
    const data = await getNews(limit);
    return { data, error: null };
  } catch (error) {
    return { data: [] as NewsArticle[], error: error as Error };
  }
}

export async function fetchPublishedNewsArticle(id: number) {
  try {
    const rows = await getNews();
    return { data: rows.find((row) => row.id === id) ?? null, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function fetchActiveEvents(limit?: number) {
  try {
    const data = await getEvents(limit);
    return { data, error: null };
  } catch (error) {
    return { data: [] as Event[], error: error as Error };
  }
}

export async function fetchPublishedGallery(limit?: number) {
  try {
    const data = await getGallery(limit);
    return { data, error: null };
  } catch (error) {
    return { data: [] as GalleryImage[], error: error as Error };
  }
}

export async function fetchLeadership(limit?: number) {
  try {
    const data = await getLeadership(limit);
    return { data, error: null };
  } catch (error) {
    return { data: [] as Leader[], error: error as Error };
  }
}

export async function fetchAboutSnapshot() {
  const snapshot: AboutSnapshot = {
    history: '',
    mission: '',
    vision: '',
    values: '',
    objectives: '',
  };

  try {
    const rows = await getAbout();
    for (const row of rows) {
      const key = row.section as AboutSectionKey;
      if (key in snapshot) {
        snapshot[key] = row.content ?? '';
      }
    }
    return { data: snapshot, error: null };
  } catch (error) {
    return { data: snapshot, error: error as Error };
  }
}

export async function fetchPublishedAlumni(limit?: number) {
  try {
    const rows = await sql<{
      id: number;
      name: string;
      role: string | null;
      image: string | null;
      created_at: string;
    }[]>`
      SELECT id, name, role, image, created_at
      FROM leadership_members
      ORDER BY created_at DESC
      ${limit ? sql`LIMIT ${limit}` : sql``}
    `;

    return {
      data: rows.map((row) => ({
        id: row.id,
        full_name: row.name,
        graduation_year: null,
        biography: null,
        achievements: null,
        current_position: row.role,
        organization: null,
        specialty: null,
        image_url: toImageUrl(row.image),
        profile_links: null,
        featured: false,
        order_position: null,
        status: 'published' as const,
      })),
      error: null,
    };
  } catch (error) {
    return { data: [] as NotableAlumnus[], error: error as Error };
  }
}

export async function fetchHomeContent(): Promise<HomeContent> {
  const [newsResult, eventsResult, leadershipResult, galleryResult, aboutResult] = await Promise.all([
    fetchPublishedNews(3),
    fetchActiveEvents(10),
    fetchLeadership(6),
    fetchPublishedGallery(12),
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
    stats: {
      storiesCount: newsResult.data.length,
      eventsCount: eventsResult.data.length,
      leadersCount: leadershipResult.data.length,
    },
  };
}
