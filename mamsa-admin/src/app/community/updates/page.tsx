import Link from 'next/link';
import { fetchPublishedNews, type NewsArticle } from '@/lib/public-content';
import { formatDate } from '@/lib/public-content-utils';

export const revalidate = 120;

export default async function UpdatesPage() {
  const { data: articles, error } = await fetchPublishedNews();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Updates</p>
        <h1 className="text-4xl font-bold text-gray-900">Community News & Stories</h1>
        <p className="text-base text-gray-600">
          Discover the latest highlights, announcements, and reflections from the MAMSA community.
        </p>
      </div>

      {error && (
        <div className="mt-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          We couldn&apos;t load the latest articles right now. Please try again shortly.
        </div>
      )}

      {articles.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-lg font-semibold text-gray-700">No updates yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Published stories from the admin panel will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {articles.map((article: NewsArticle) => (
            <article
              key={article.id}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              {article.featured_image && (
                <Link href={`/community/updates/${article.id}`} className="relative block aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={article.featured_image}
                    alt={article.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </Link>
              )}
              <div className="flex flex-1 flex-col space-y-4 px-6 py-6 sm:px-8">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                  {formatDate(article.published_at)}
                </p>
                <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                  <Link href={`/community/updates/${article.id}`} className="transition hover:text-emerald-700">
                    {article.title}
                  </Link>
                </h2>
                <p className="flex-1 text-sm text-gray-600">
                  {article.excerpt ||
                    article.content?.slice(0, 220) ||
                    'Details for this story will be available soon.'}
                  {article.content && article.content.length > 220 ? '…' : ''}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{article.author || 'MAMSA Editorial Team'}</span>
                  <Link
                    href={`/community/updates/${article.id}`}
                    className="inline-flex items-center gap-1 font-medium text-emerald-600 transition hover:text-emerald-700"
                  >
                    Continue reading
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 8 8">
                      <path d="M1 4h5M4 1l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

