import { fetchLeadership, type Leader } from '@/lib/public-content';

export const revalidate = 300;

export default async function LeadershipPage() {
  const { data: leaders, error } = await fetchLeadership();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Leadership</p>
        <h1 className="text-4xl font-bold text-gray-900">Guiding the MAMSA Community</h1>
        <p className="text-base text-gray-600">
          Meet the dedicated students and mentors who steward our programs, events, and community outreach.
        </p>
      </div>

      {error && (
        <div className="mt-8 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          We couldn&apos;t load the leadership directory. Please refresh or try again later.
        </div>
      )}

      {leaders.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <p className="text-lg font-semibold text-gray-700">Leadership directory coming soon</p>
          <p className="mt-2 text-sm text-gray-500">
            Profiles published in the admin panel will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {leaders.map((leader: Leader) => (
            <article
              key={leader.id}
              className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded-2xl bg-gray-100 shadow-sm">
                {leader.image_url ? (
                  <img
                    src={leader.image_url}
                    alt={leader.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-50 text-3xl font-semibold text-emerald-700">
                    {leader.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="mt-6 text-xl font-semibold text-gray-900">{leader.name}</h2>
              <p className="mt-2 text-sm font-medium text-emerald-600">{leader.position || 'Leadership Team'}</p>
              {leader.department && (
                <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  {leader.department}
                </span>
              )}
              <p className="mt-4 line-clamp-4 text-sm text-gray-600">
                {leader.bio || 'Biography coming soon.'}
              </p>
              <div className="mt-4 flex flex-col gap-1 text-xs text-gray-500">
                {leader.email && <span>{leader.email}</span>}
                {leader.phone && <span>{leader.phone}</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

