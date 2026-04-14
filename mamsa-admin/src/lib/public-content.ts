import { cache } from 'react';
import sql from '@/lib/db';
import { resolveImageSrc } from '@/lib/image-utils';
import type { GalleryItem } from '@/types/gallery';
import { rowToGalleryItem, type GalleryRowRaw } from '@/types/gallery';

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

/** Legacy narrow shape; public gallery pages prefer `GalleryItem`. */
export type GalleryImage = {
  id: number;
  title: string;
  image_url: string | null;
  category: string | null;
  description: string | null;
  featured: boolean;
  created_at?: string;
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
  order_position?: number | null;
};

export type NotableAlumnus = {
  id: number;
  full_name: string;
  slug: string | null;
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
  about: AboutSnapshot;
  hasError: boolean;
  stats: HomeContentStats;
};

export type SkilledStudentPublic = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  bio: string | null;
  category: 'skill' | 'business';
  title: string;
  description: string | null;
  location: string | null;
  website_url: string | null;
  social_links: Record<string, unknown> | null;
  is_featured: boolean;
  latest_payment_amount: string | null;
  latest_payment_currency: string | null;
  latest_payment_date: string | null;
  latest_payment_expiry: string | null;
};

function publicImagePath(val: string | null): string | null {
  if (val == null || val === '') return null;
  const u = resolveImageSrc(val);
  return u || null;
}

function parseSkilledSocialLinks(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  let obj: unknown = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    return obj as Record<string, unknown>;
  }
  return null;
}

function parseAlumniProfileLinks(raw: unknown): NotableAlumnus['profile_links'] {
  if (raw == null) return null;
  let obj: unknown = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof obj !== 'object' || obj === null) return null;
  const o = obj as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === 'string' ? (o[k] as string) : null);
  const linkedin = str('linkedin');
  const twitter = str('twitter');
  const website = str('website');
  if (!linkedin && !twitter && !website) return null;
  return { linkedin, twitter, website };
}

function mapNotableAlumniRow(row: {
  id: number;
  full_name: string;
  slug: string | null;
  graduation_year: number | null;
  biography: string | null;
  achievements: string | null;
  current_position: string | null;
  organization: string | null;
  specialty: string | null;
  image_url: string | null;
  profile_links: unknown;
  featured: boolean;
  order_position: number | null;
}): NotableAlumnus {
  return {
    id: row.id,
    full_name: row.full_name,
    slug: row.slug,
    graduation_year: row.graduation_year,
    biography: row.biography,
    achievements: row.achievements,
    current_position: row.current_position,
    organization: row.organization,
    specialty: row.specialty,
    image_url: publicImagePath(row.image_url),
    profile_links: parseAlumniProfileLinks(row.profile_links),
    featured: row.featured,
    order_position: row.order_position,
    status: 'published',
  };
}

export async function getPublishedNotableAlumni(limit?: number) {
  const rows = await sql<
    Array<{
      id: number;
      full_name: string;
      slug: string | null;
      graduation_year: number | null;
      biography: string | null;
      achievements: string | null;
      current_position: string | null;
      organization: string | null;
      specialty: string | null;
      image_url: string | null;
      profile_links: unknown;
      featured: boolean;
      order_position: number | null;
    }>
  >`
    SELECT id, full_name, slug, graduation_year, biography, achievements, current_position, organization, specialty, image_url, profile_links, featured, order_position
    FROM notable_alumni
    WHERE status = 'published'
    ORDER BY order_position IS NULL DESC, order_position ASC, created_at DESC
    ${limit != null ? sql`LIMIT ${limit}` : sql``}
  `;

  return rows.map((row) => mapNotableAlumniRow(row));
}

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
    image: publicImagePath(row.image),
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
    featured_image: publicImagePath(row.featured_image),
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
    featured_image: publicImagePath(row.featured_image),
  }));
}

export const getGalleryItems = cache(async (category?: string, limit?: number) => {
  const cat = category?.trim();
  const rows = await sql<GalleryRowRaw[]>`
    SELECT *
    FROM gallery
    WHERE status = 'active'
    ${cat ? sql`AND category = ${cat}` : sql``}
    ORDER BY featured DESC, created_at DESC
    ${limit != null && limit > 0 ? sql`LIMIT ${limit}` : sql``}
  `;

  return rows.map((row) => {
    const item = rowToGalleryItem(row);
    return { ...item, image_url: publicImagePath(item.image_url) } as GalleryItem;
  });
});

export const getFeaturedGalleryItems = cache(async () => {
  const rows = await sql<GalleryRowRaw[]>`
    SELECT *
    FROM gallery
    WHERE status = 'active' AND featured = 1
    ORDER BY created_at DESC
    LIMIT 8
  `;

  return rows.map((row) => {
    const item = rowToGalleryItem(row);
    return { ...item, image_url: publicImagePath(item.image_url) } as GalleryItem;
  });
});

export async function getGallery(limit?: number) {
  const items = await getGalleryItems(undefined, limit);
  return items.map(
    (row): GalleryImage => ({
      id: row.id,
      title: row.title,
      description: row.description,
      image_url: row.image_url,
      category: row.category,
      featured: row.is_featured === 1,
      created_at: row.created_at,
    }),
  );
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
    image_url: publicImagePath(row.image_url),
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
    image_url: publicImagePath(row.image_url),
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
    image_url: publicImagePath(row.image_url),
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
    if (rows.length > 0) {
      const data: NewsArticle[] = rows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        excerpt: row.excerpt,
        category: 'general',
        date: row.published_at,
        author: row.author,
        image: null,
        featured_image: publicImagePath(row.featured_image),
        status: row.status,
        published_at: row.published_at,
        tags: row.tags,
      }));
      return { data: limit ? data.slice(0, limit) : data, error: null };
    }

    // Fallback for environments that still use the legacy `news` table directly.
    const legacyRows = await getNews();
    const legacyData: NewsArticle[] = legacyRows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt,
      category: row.category,
      date: row.date,
      author: row.author,
      image: row.image,
      featured_image: row.image,
      status: 'published',
      published_at: row.date,
      tags: row.tags,
    }));

    return { data: limit ? legacyData.slice(0, limit) : legacyData, error: null };
  } catch (error) {
    return { data: [] as NewsArticle[], error: error as Error };
  }
}

export async function fetchPublishedNewsArticle(id: number) {
  try {
    const articleRows = await sql<
      Array<{
        id: number;
        title: string;
        content: string | null;
        excerpt: string | null;
        author: string | null;
        published_at: string | null;
        status: 'published' | 'draft' | 'archived' | null;
        featured_image: string | null;
        tags: string[] | null;
      }>
    >`
      SELECT id, title, content, excerpt, author, published_at, status, featured_image, tags
      FROM news_articles
      WHERE id = ${id} AND status = 'published'
      LIMIT 1
    `;

    const article = articleRows[0];
    if (article) {
      return {
        data: {
          id: article.id,
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          category: 'general',
          date: article.published_at,
          author: article.author,
          image: null,
          featured_image: publicImagePath(article.featured_image),
          status: article.status,
          published_at: article.published_at,
          tags: article.tags,
        },
        error: null,
      };
    }

    const legacyRows = await sql<
      Array<{
        id: number;
        title: string;
        content: string | null;
        excerpt: string | null;
        category: string | null;
        date: string | null;
        image: string | null;
        author: string | null;
        tags: string[] | null;
      }>
    >`
      SELECT id, title, content, excerpt, category, date, image, author, tags
      FROM news
      WHERE id = ${id}
      LIMIT 1
    `;

    const newsItem = legacyRows[0] ?? null;

    return {
      data: newsItem
        ? {
            id: newsItem.id,
            title: newsItem.title,
            content: newsItem.content,
            excerpt: newsItem.excerpt,
            category: newsItem.category,
            date: newsItem.date,
            author: newsItem.author,
            image: publicImagePath(newsItem.image),
            featured_image: publicImagePath(newsItem.image),
            status: 'published',
            published_at: newsItem.date,
            tags: newsItem.tags,
          }
        : null,
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function fetchEventById(id: number) {
  try {
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
      WHERE id = ${id}
      LIMIT 1
    `;

    const row = rows[0] ?? null;

    if (!row) {
      return { data: null, error: null };
    }

    return {
      data: {
        ...row,
        featured_image: publicImagePath(row.featured_image),
      } as Event,
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

export async function fetchActiveEvents(limit?: number) {
  try {
    const data = await getEvents(limit);
    return {
      data: data.map((row) => ({
        ...row,
        featured_image: publicImagePath(row.featured_image),
      })),
      error: null,
    };
  } catch (error) {
    return { data: [] as Event[], error: error as Error };
  }
}

export async function fetchPublishedGallery(limit?: number) {
  try {
    const data = await getGalleryItems(undefined, limit);
    return {
      data,
      error: null,
    };
  } catch (error) {
    return { data: [] as GalleryItem[], error: error as Error };
  }
}

export async function fetchLeadership(limit?: number) {
  try {
    const data = await getLeadership(limit);
    return {
      data: data.map((row) => ({
        ...row,
        image_url: publicImagePath(row.image_url),
      })),
      error: null,
    };
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
    const data = await getPublishedNotableAlumni(limit);
    return { data, error: null };
  } catch (error) {
    return { data: [] as NotableAlumnus[], error: error as Error };
  }
}

export const fetchPublishedAlumniById = cache(async (id: number) => {
  try {
    const rows = await sql<
      Array<{
        id: number;
        full_name: string;
        slug: string | null;
        graduation_year: number | null;
        biography: string | null;
        achievements: string | null;
        current_position: string | null;
        organization: string | null;
        specialty: string | null;
        image_url: string | null;
        profile_links: unknown;
        featured: boolean;
        order_position: number | null;
      }>
    >`
      SELECT id, full_name, slug, graduation_year, biography, achievements, current_position, organization, specialty, image_url, profile_links, featured, order_position
      FROM notable_alumni
      WHERE id = ${id} AND status = 'published'
      LIMIT 1
    `;

    const row = rows[0];
    return {
      data: row ? mapNotableAlumniRow(row) : null,
      error: null,
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
});

async function getHomeStats(): Promise<HomeContentStats> {
  try {
    const [newsCount, eventsCount, leadersCount] = await Promise.all([
      sql<Array<{ count: number | string | bigint }>>`SELECT COUNT(*) AS count FROM news`,
      sql<Array<{ count: number | string | bigint }>>`
        SELECT COUNT(*) AS count FROM events WHERE status IN ('upcoming', 'ongoing')
      `,
      sql<Array<{ count: number | string | bigint }>>`SELECT COUNT(*) AS count FROM leadership WHERE status = 'active'`,
    ]);

    return {
      storiesCount: Number(newsCount[0]?.count ?? 0),
      eventsCount: Number(eventsCount[0]?.count ?? 0),
      leadersCount: Number(leadersCount[0]?.count ?? 0),
    };
  } catch {
    return { storiesCount: 0, eventsCount: 0, leadersCount: 0 };
  }
}

type ActiveSkilledStudentRow = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  profile_image: string | null;
  bio: string | null;
  category: 'skill' | 'business';
  title: string;
  description: string | null;
  location: string | null;
  website_url: string | null;
  social_links: unknown;
  is_active: number;
  is_featured: number;
  created_at: string;
  updated_at: string | null;
  latest_payment_id: number | null;
  latest_payment_amount: string | number | null;
  latest_payment_currency: string | null;
  latest_payment_date: string | null;
  latest_payment_expiry: string | null;
  latest_payment_status: string | null;
  latest_payment_method: string | null;
  latest_payment_ref: string | null;
};

function mapActiveSkilledStudentRow(row: ActiveSkilledStudentRow): SkilledStudentPublic {
  const profileImage = publicImagePath(row.profile_image);

  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    profile_image: profileImage,
    bio: row.bio,
    category: row.category,
    title: row.title,
    description: row.description,
    location: row.location,
    website_url: row.website_url,
    social_links: parseSkilledSocialLinks(row.social_links),
    is_featured: Boolean(row.is_featured),
    latest_payment_amount: row.latest_payment_amount != null ? String(row.latest_payment_amount) : null,
    latest_payment_currency: row.latest_payment_currency ?? null,
    latest_payment_date: row.latest_payment_date ?? null,
    latest_payment_expiry: row.latest_payment_expiry ?? null,
  };
}

/** Published skilled students: `active_skilled_students` view (valid payment + listing on). */
export const getActiveSkilledStudents = cache(async (category?: string): Promise<SkilledStudentPublic[]> => {
  const catOk = category === 'skill' || category === 'business' ? category : null;
  const rows = await sql<ActiveSkilledStudentRow[]>`
    SELECT *
    FROM active_skilled_students
    WHERE 1 = 1
      ${catOk ? sql`AND category = ${catOk}` : sql``}
    ORDER BY is_featured DESC, created_at DESC
  `;

  // Fallback for environments where the SQL view is missing/stale:
  // still show active listings from base table.
  if (rows.length > 0) {
    return rows.map(mapActiveSkilledStudentRow);
  }

  const fallbackRows = await sql<ActiveSkilledStudentRow[]>`
    SELECT
      s.*,
      lp.id AS latest_payment_id,
      lp.amount AS latest_payment_amount,
      lp.currency AS latest_payment_currency,
      lp.payment_date AS latest_payment_date,
      lp.expiry_date AS latest_payment_expiry,
      lp.status AS latest_payment_status,
      lp.payment_method AS latest_payment_method,
      lp.transaction_ref AS latest_payment_ref
    FROM skilled_students s
    LEFT JOIN (
      SELECT p1.*
      FROM student_payments p1
      INNER JOIN (
        SELECT student_id, MAX(payment_date) AS max_date
        FROM student_payments
        GROUP BY student_id
      ) p2
        ON p1.student_id = p2.student_id AND p1.payment_date = p2.max_date
    ) lp ON lp.student_id = s.id
    WHERE s.is_active = 1
      ${catOk ? sql`AND s.category = ${catOk}` : sql``}
    ORDER BY s.is_featured DESC, s.created_at DESC
  `;

  return fallbackRows.map(mapActiveSkilledStudentRow);
});

/** Single public profile if the student appears on the active view. */
export const getSkilledStudentById = cache(async (id: number): Promise<SkilledStudentPublic | null> => {
  const rows = await sql<ActiveSkilledStudentRow[]>`
    SELECT * FROM active_skilled_students WHERE id = ${id} LIMIT 1
  `;
  const row = rows[0];
  if (row) return mapActiveSkilledStudentRow(row);

  const fallbackRows = await sql<ActiveSkilledStudentRow[]>`
    SELECT
      s.*,
      lp.id AS latest_payment_id,
      lp.amount AS latest_payment_amount,
      lp.currency AS latest_payment_currency,
      lp.payment_date AS latest_payment_date,
      lp.expiry_date AS latest_payment_expiry,
      lp.status AS latest_payment_status,
      lp.payment_method AS latest_payment_method,
      lp.transaction_ref AS latest_payment_ref
    FROM skilled_students s
    LEFT JOIN (
      SELECT p1.*
      FROM student_payments p1
      INNER JOIN (
        SELECT student_id, MAX(payment_date) AS max_date
        FROM student_payments
        GROUP BY student_id
      ) p2
        ON p1.student_id = p2.student_id AND p1.payment_date = p2.max_date
    ) lp ON lp.student_id = s.id
    WHERE s.id = ${id} AND s.is_active = 1
    LIMIT 1
  `;
  const fallback = fallbackRows[0];
  return fallback ? mapActiveSkilledStudentRow(fallback) : null;
});

export const fetchHomeContent = cache(async (): Promise<HomeContent> => {
  const [newsResult, eventsResult, aboutResult, stats] = await Promise.all([
    (async () => {
      try {
        const rows = await getNews();
        const mapped: NewsArticle[] = rows.slice(0, 3).map((row) => {
          const img = publicImagePath(row.image);
          return {
            id: row.id,
            title: row.title,
            content: row.content,
            excerpt: row.excerpt,
            category: row.category,
            date: row.date,
            author: row.author,
            image: img,
            featured_image: img,
            published_at: row.date,
            tags: row.tags,
          };
        });

        return { data: mapped, error: null };
      } catch (error) {
        return { data: [] as NewsArticle[], error: error as Error };
      }
    })(),
    (async () => {
      try {
        const rows = await getEvents(10);
        const data: Event[] = rows.map((row) => ({
          ...row,
          featured_image: publicImagePath(row.featured_image),
        }));
        return { data, error: null };
      } catch (error) {
        return { data: [] as Event[], error: error as Error };
      }
    })(),
    fetchAboutSnapshot(),
    getHomeStats(),
  ]);

  const hasError = Boolean(newsResult.error || eventsResult.error || aboutResult.error);

  return {
    news: newsResult.data,
    events: eventsResult.data,
    about: aboutResult.data,
    hasError,
    stats,
  };
});
