import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';

type StatRow = { count: number | string | null };

export async function GET() {
  await requireAdmin();

  try {
    const [newsRows, eventRows, leadershipRows, galleryRows, adminRows] = await Promise.all([
      sql<StatRow[]>`SELECT COUNT(*) AS count FROM news_articles`,
      sql<StatRow[]>`SELECT COUNT(*) AS count FROM events`,
      sql<StatRow[]>`SELECT COUNT(*) AS count FROM leadership`,
      sql<StatRow[]>`SELECT COUNT(*) AS count FROM gallery`,
      sql<StatRow[]>`SELECT COUNT(*) AS count FROM admin_users WHERE status = 'active'`,
    ]);

    const [news, events, leadership, gallery, totalUsers] = [
      newsRows[0]?.count ?? 0,
      eventRows[0]?.count ?? 0,
      leadershipRows[0]?.count ?? 0,
      galleryRows[0]?.count ?? 0,
      adminRows[0]?.count ?? 0,
    ].map(Number);

    const [newsActivity, eventActivity, galleryActivity, leadershipActivity, upcomingEvents] = await Promise.all([
      sql<{ id: number; title: string; created_at: string }[]>`
        SELECT id, title, created_at
        FROM news_articles
        ORDER BY created_at DESC
        LIMIT 4
      `,
      sql<{ id: number; title: string; created_at: string }[]>`
        SELECT id, title, created_at
        FROM events
        ORDER BY created_at DESC
        LIMIT 4
      `,
      sql<{ id: number; title: string; created_at: string }[]>`
        SELECT id, title, created_at
        FROM gallery
        ORDER BY created_at DESC
        LIMIT 4
      `,
      sql<{ id: number; name: string; created_at: string }[]>`
        SELECT id, name, created_at
        FROM leadership
        ORDER BY created_at DESC
        LIMIT 4
      `,
      sql<{ id: number; title: string; date: string; location: string | null; capacity: number | null }[]>`
        SELECT id, title, date, location, capacity
        FROM events
        WHERE date >= CURRENT_DATE
        ORDER BY date ASC
        LIMIT 3
      `,
    ]);

    const recentActivity = [
      ...newsActivity.map((item) => ({
        id: `news-${item.id}`,
        type: 'news' as const,
        action: 'Published new article',
        title: item.title,
        time: item.created_at,
        user: 'Admin',
      })),
      ...eventActivity.map((item) => ({
        id: `event-${item.id}`,
        type: 'event' as const,
        action: 'Created new event',
        title: item.title,
        time: item.created_at,
        user: 'Admin',
      })),
      ...galleryActivity.map((item) => ({
        id: `gallery-${item.id}`,
        type: 'gallery' as const,
        action: 'Uploaded image',
        title: item.title,
        time: item.created_at,
        user: 'Admin',
      })),
      ...leadershipActivity.map((item) => ({
        id: `leadership-${item.id}`,
        type: 'leadership' as const,
        action: 'Updated profile',
        title: item.name,
        time: item.created_at,
        user: 'Admin',
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 4);

    return NextResponse.json({
      data: {
        stats: {
          news,
          events,
          leadership,
          gallery,
          totalUsers,
          totalViews: 15420,
        },
        recentActivity: recentActivity.map((item) => ({
          ...item,
          time: item.time,
        })),
        upcomingEvents: upcomingEvents.map((event) => ({
          id: event.id,
          title: event.title,
          date: event.date,
          location: event.location ?? 'TBA',
          attendees: event.capacity ?? 0,
        })),
      },
    });
  } catch (error) {
    console.error('[api/admin/dashboard][GET] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}
