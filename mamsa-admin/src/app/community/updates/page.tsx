import { fetchPublishedNews, formatDate } from '@/lib/public-content';

export const revalidate = 120;

export default async function UpdatesPage() {
  const { data: articles, error } = await fetchPublishedNews();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="space-y-4 text-center">
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

      <div className="mt-12 space-y-8">
        {articles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <p className="text-lg font-semibold text-gray-700">No updates yet</p>
            <p className="mt-2 text-sm text-gray-500">
              Published stories from the admin panel will appear here automatically.
            </p>
          </div>
        ) : (
          articles.map((article) => (
            <article key={article.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              {article.featured_image && (
                <img
                  src={article.featured_image}
                  alt={article.title}
                  className="h-60 w-full rounded-t-2xl object-cover"
                  loading="lazy"
                />
              )}
              <div className="space-y-4 px-8 py-6">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                  {formatDate(article.published_at)}
                </p>
                <h2 className="text-2xl font-semibold text-gray-900">{article.title}</h2>
                <p className="text-sm text-gray-600">
                  {article.excerpt ||
                    article.content?.slice(0, 220) ||
                    'Details for this story will be available soon.'}
                  {article.content && article.content.length > 220 ? '…' : ''}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{article.author || 'MAMSA Editorial Team'}</span>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                    Continue reading
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 8 8">
                      <path d="M1 4h5M4 1l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

