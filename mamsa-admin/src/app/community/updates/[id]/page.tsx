import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchPublishedNewsArticle } from '@/lib/public-content';
import { formatDate } from '@/lib/public-content-utils';

type PageProps = {
  params: { id: string };
};

export const revalidate = 180;

export default async function UpdateDetailPage({ params }: PageProps) {
  const id = Number(params.id);

  if (!Number.isFinite(id)) {
    notFound();
  }

  const { data: article } = await fetchPublishedNewsArticle(id);

  if (!article) {
    notFound();
  }

  const renderContent = (article.content || article.excerpt || '').trim();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <nav className="text-sm text-emerald-600">
        <Link href="/" className="hover:text-emerald-700">
          Home
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <Link href="/community/updates" className="hover:text-emerald-700">
          Updates
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-500">{article.title}</span>
      </nav>

      <header className="mt-8 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
          {formatDate(article.published_at)}
        </p>
        <h1 className="text-4xl font-bold text-gray-900">{article.title}</h1>
        <p className="text-sm text-gray-500">{article.author || 'MAMSA Editorial Team'}</p>
      </header>

      {article.featured_image && (
        <div className="mt-10 overflow-hidden rounded-3xl border border-gray-100 bg-gray-50">
          <img
            src={article.featured_image}
            alt={article.title}
            className="h-auto w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <article className="prose prose-emerald mt-10 max-w-none prose-headings:text-gray-900 prose-p:text-gray-700">
        {renderContent ? (
          renderContent.split(/\n{2,}/).map((paragraph: string, index: number) => (
            <p key={index} className="leading-relaxed">
              {paragraph}
            </p>
          ))
        ) : (
          <p className="text-gray-600">
            The full story will be available soon. Please check back for updates from the MAMSA team.
          </p>
        )}
      </article>

      <div className="mt-16 flex flex-col gap-6 border-t border-gray-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Explore more community stories</p>
          <p className="text-sm text-gray-500">
            Discover the latest updates, events, and leadership highlights from the MAMSA community.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/community/updates"
            className="inline-flex items-center justify-center rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Back to Updates
          </Link>
          <Link
            href="/community/events"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Upcoming Events
          </Link>
        </div>
      </div>
    </div>
  );
}

