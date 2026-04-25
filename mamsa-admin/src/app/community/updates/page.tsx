import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { fetchPublishedNews, type NewsArticle } from '@/lib/public-content';
import { formatDate } from '@/lib/public-content-utils';
import { CardImage } from '@/components/ui/CardImage';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export const revalidate = 120;

export default async function UpdatesPage() {
  const { data: articles, error } = await fetchPublishedNews();

  return (
    <>
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 text-white -mt-16 pt-20 sm:pt-24">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
            <img
              src="/images/IMG-20250408-WA0092.jpg"
              alt="MAMSA Updates"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-700/85 via-emerald-600/80 to-emerald-500/85" />
          </div>
          <ScrollReveal className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-12 text-center sm:gap-6 sm:px-8 sm:py-16 md:px-10 md:py-20 lg:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 sm:text-sm">Updates</p>
            <h1 className="text-2xl font-bold drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">Community News & Stories</h1>
            <p className="mx-auto max-w-2xl text-sm text-white/95 sm:text-base drop-shadow-md">
              Latest updates from the MAMSA community.
            </p>
          </ScrollReveal>
        </header>

        <div className="mx-auto max-w-5xl px-6 py-12">

      {error && (
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:shadow-black/20">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">News & Stories Temporarily Unavailable</h3>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-200/90">
                We&apos;re having a brief issue loading the latest updates. This is usually resolved quickly. Please refresh the page in a moment, or check back shortly for the latest MAMSA news and stories.
              </p>
            </div>
          </div>
        </div>
      )}

      {articles.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-gray-200 p-10 text-center dark:border-emerald-800/60 dark:bg-emerald-950/30">
          <p className="text-lg font-semibold text-gray-700 dark:text-emerald-100">No updates yet</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-emerald-300/75">
            Updates will be shown here.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article: NewsArticle, index) => (
            <ScrollReveal key={article.id} delay={index * 80}>
              <article className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md dark:border-emerald-800/55 dark:bg-emerald-950/85 dark:shadow-black/20">
                <CardImage
                  src={article.featured_image}
                  alt={article.title || 'News'}
                  aspect="video"
                  position="center"
                  overlay
                  rounded="top"
                  placeholderIcon={<Newspaper className="h-8 w-8 text-gray-300 dark:text-emerald-700/80" />}
                  placeholderLabel="No image"
                />
                <div className="flex flex-1 flex-col p-4">
                  {article.tags?.[0] ? (
                    <span className="inline-flex w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      {article.tags[0]}
                    </span>
                  ) : null}
                  <h2 className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900 dark:text-emerald-50">
                    <Link href={`/community/updates/${article.id}`} className="transition hover:text-emerald-700 dark:hover:text-emerald-300">
                      {article.title}
                    </Link>
                  </h2>
                  <p className="mt-1 line-clamp-2 flex-1 text-xs text-gray-500 dark:text-emerald-300/70">
                    {article.excerpt ||
                      article.content?.slice(0, 220) ||
                      'Details for this story will be available soon.'}
                    {article.content && article.content.length > 220 ? '…' : ''}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-emerald-500/70">{formatDate(article.published_at)}</span>
                    <Link
                      href={`/community/updates/${article.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      Read more
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 8 8">
                        <path d="M1 4h5M4 1l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      )}
        </div>
    </>
  );
}

