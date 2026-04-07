import sql from '@/lib/db';
import { getPublicUrl } from '@/lib/cloudinary';

export const ABOUT_SECTIONS = ['history', 'mission', 'vision', 'values', 'objectives'] as const;
export type AboutSectionKey = typeof ABOUT_SECTIONS[number];
export type AboutSnapshot = Record<AboutSectionKey, string>;

export type NewsArticle = {
  id: number;
  title: string;
  content: string | null;
  excerpt: string | null;
  category: string | null;
  date: string | null;
  author: string | null;
  image: string | null;
  featured_image: string | null;
  status?: 'published' | 'draft' | 'archived' | null;
  published_at: string | null;
  tags?: string[] | null;
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
  service_key: string;
  title: string;
  description: string | null;
  features: unknown;
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

const resolveImage = (val: string | null) => (!val ? null : val.startsWith('http') ? val : getPublicUrl(val));

export async function getAboutSections() {
  const rows = await sql<Array<{ id: number; section: string; content: string | null; created_at: string; updated_at: string | null }>>`
    SELECT *
    FROM about
    ORDER BY id
  `;

  return rows;
}

export async function getAbout() {
  return getAboutSections();
}

export async function getNews() {
  const rows = await sql<
    Array<{
      id: number;
      title: string;
      excerpt: string | null;
      content: string | null;
      category: string | null;
      date: string | null;
      image: string | null;
      featured: boolean | null;
      author: string | null;
      tags: string[] | null;
      created_at: string;
      updated_at: string | null;
    }>
  >`
    SELECT *
    FROM news
    ORDER BY date DESC
  `;

  return rows.map((row) => ({
    ...row,
    image: resolveImage(row.image),
  }));
}

export async function getNewsArticles() {
  const rows = await sql<
    Array<{
      id: number;
      title: string;
      content: string | null;
      excerpt: string | null;
      author: string | null;
      published_at: string | null;
      created_at: string;
      updated_at: string | null;
      status: 'published' | 'draft' | 'archived' | null;
      featured_image: string | null;
      tags: string[] | null;
    }>
  >`
    SELECT *
    FROM news_articles
    WHERE status = 'published'
    ORDER BY published_at DESC
  `;

  return rows.map((row) => ({
    ...row,
    featured_image: resolveImage(row.featured_image),
  }));
}

export async function getEvents(limit?: number) {
  const rows = await sql<
    Array<{
      id: number;
      title: string;
      description: string | null;
      date: string | null;
      time: string | null;
      location: string | null;
      status: string | null;
      featured_image: string | null;
      organizer: string | null;
      contact_email: string | null;
    }>
  >`
    SELECT *
    FROM events
    WHERE status IN ('upcoming', 'ongoing')
    ORDER BY date ASC
    ${limit ? sql`LIMIT ${limit}` : sql``}
  `;

  return rows.map((row) => ({
    ...row,
    featured_image: resolveImage(row.featured_image),
  }));
}

export async function getGallery(limit?: number) {
  const rows = await sql<
    Array<{
      id: number;
      title: string;
      description: string | null;
      image_url: string | null;
      category: string | null;
      featured: boolean;
      status: string;
      created_at: string;
    }>
  >`
    SELECT *
    FROM gallery
    WHERE status = 'active'
    ORDER BY created_at DESC
    ${limit ? sql`LIMIT ${limit}` : sql``}
  `;

  return rows.map((row) => ({
    ...row,
    image_url: resolveImage(row.image_url),
  }));
}

export async function getGalleryImages(_galleryId?: number) {
  const rows = await sql<
    Array<{
      id: number;
      title: string;
      description: string | null;
      image_url: string | null;
      category: string | null;
      featured: boolean;
      status: string;
      created_at: string;
    }>
  >`
    SELECT *
    FROM gallery_images
    WHERE status = 'active'
    ORDER BY created_at DESC
  `;

  return rows.map((row) => ({
    ...row,
    image_url: resolveImage(row.image_url),
  }));
}

export async function getLeadership(limit?: number) {
  const rows = await sql<
    Array<{
      id: number;
      name: string;
      position: string | null;
      bio: string | null;
      image_url: string | null;
      department: string | null;
      email: string | null;
      phone: string | null;
      status: string;
      order_position: number;
    }>
  >`
    SELECT *
    FROM leadership
    WHERE status = 'active'
    ORDER BY order_position ASC
    ${limit ? sql`LIMIT ${limit}` : sql``}
  `;

  return rows.map((row) => ({
    ...row,
    image_url: resolveImage(row.image_url),
  }));
}

export async function getLeadershipMembers(limit?: number) {
  const rows = await sql<
    Array<{
      id: number;
      name: string;
      position: string | null;
      bio: string | null;
      image_url: string | null;
      department: string | null;
      email: string | null;
      phone: string | null;
      status: string;
      order_position: number;
      social_links: { linkedin?: string | null; twitter?: string | null; website?: string | null } | null;
      year: string | null;
    }>
  >`
    SELECT *
    FROM leadership_members
    WHERE status = 'active'
    ORDER BY order_position ASC
    ${limit ? sql`LIMIT ${limit}` : sql``}
  `;

  return rows.map((row) => ({
    ...row,
    image_url: resolveImage(row.image_url),
  }));
}

export async function getContact() {
  const rows = await sql<Array<ContactInfo>>`
    SELECT *
    FROM contact
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function getServices() {
  const rows = await sql<Array<Service>>`
    SELECT *
    FROM services
    ORDER BY id ASC
  `;

  return rows;
}

export async function getSettings() {
  const rows = await sql<Array<{ setting_key: string; setting_value: string | null }>>`
    SELECT setting_key, setting_value
    FROM settings
  `;

  return rows.reduce<SettingsMap>((acc, row) => {
    acc[row.setting_key] = row.setting_value ?? '';
    return acc;
  }, {});
}

export async function fetchPublishedNews(limit?: number) {
  try {
    const rows = await getNewsArticles();
    const data: NewsArticle[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt,
      category: 'general',
      date: row.published_at,
      author: row.author,
      image: null,
      featured_image: row.featured_image,
      status: row.status,
      published_at: row.published_at,
      tags: row.tags,
    }));

    return { data: limit ? data.slice(0, limit) : data, error: null };
  } catch (error) {
    return { data: [] as NewsArticle[], error: error as Error };
  }
}

export async function fetchPublishedNewsArticle(id: number) {
  try {
    const rows = await getNewsArticles();
    const item = rows.find((row) => row.id === id) ?? null;

    return {
      data: item
        ? {
            id: item.id,
            title: item.title,
            content: item.content,
            excerpt: item.excerpt,
            category: 'general',
            date: item.published_at,
            author: item.author,
            image: null,
            featured_image: item.featured_image,
            status: item.status,
            published_at: item.published_at,
            tags: item.tags,
          }
        : null,
      error: null,
    };
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
    const rows = await getAboutSections();
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
    const rows = await getLeadershipMembers(limit);

    return {
      data: rows.map((row) => ({
        id: row.id,
        full_name: row.name,
        graduation_year: row.year ? Number(row.year) || null : null,
        biography: row.bio,
        achievements: null,
        current_position: row.position,
        organization: row.department,
        specialty: row.department,
        image_url: row.image_url,
        profile_links: row.social_links,
        featured: false,
        order_position: row.order_position,
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
    (async () => {
      try {
        const rows = await getNews();
        const mapped: NewsArticle[] = rows.slice(0, 3).map((row) => ({
          id: row.id,
          title: row.title,
          content: row.content,
          excerpt: row.excerpt,
          category: row.category,
          date: row.date,
          author: row.author,
          image: row.image,
          featured_image: row.image,
          published_at: row.date,
          tags: row.tags,
        }));

        return { data: mapped, error: null };
      } catch (error) {
        return { data: [] as NewsArticle[], error: error as Error };
      }
    })(),
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
