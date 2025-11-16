'use client';

import { useState } from 'react';
import { Leader } from '@/lib/public-content';

interface LeaderCardProps {
  leader: Leader;
}

export default function LeaderCard({ leader }: LeaderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className="w-full max-w-md flex flex-col items-center rounded-xl border-2 border-emerald-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-emerald-300">
      {/* Circular Profile Image */}
      <div className="relative h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 overflow-hidden rounded-full bg-gray-100 border-2 border-emerald-100 shadow-md">
        {leader.image_url ? (
          <img
            src={leader.image_url}
            alt={leader.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-emerald-200 text-xl sm:text-2xl md:text-3xl font-semibold text-emerald-700">
            {leader.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name and Position */}
      <h2 className="mt-4 text-center text-base sm:text-lg md:text-xl font-semibold text-gray-900">
        {leader.name}
      </h2>
      <p className="mt-1 text-center text-sm sm:text-base font-medium text-emerald-600">
        {leader.position || 'Leadership Team'}
      </p>

      {/* Collapsible Content */}
      <div className="mt-4 w-full">
        {/* Toggle Button */}
        {(leader.bio || leader.email || leader.phone) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Hide details' : 'Show details'}
          >
            <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {/* Expandable Content */}
        {isExpanded && (
          <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Bio */}
            {leader.bio && (
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm text-gray-700 leading-relaxed">{leader.bio}</p>
              </div>
            )}

            {/* Contact Information */}
            {(leader.email || leader.phone) && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Contact
                </h3>
                <div className="space-y-1.5 text-sm text-gray-700">
                  {leader.email && (
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${leader.email}`} className="hover:text-emerald-600 hover:underline">
                        {leader.email}
                      </a>
                    </div>
                  )}
                  {leader.phone && (
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href={`tel:${leader.phone}`} className="hover:text-emerald-600 hover:underline">
                        {leader.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

