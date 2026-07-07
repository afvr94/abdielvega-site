import Link from 'next/link';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getUpNext } from '@/lib/tv/queries';
import { UpNextCard } from '@/components/tv/UpNextCard';

export const metadata = { title: 'Up Next' };

export default async function TvHomePage() {
  const db = await createClient();
  const items = await getUpNext(db);
  const behind = items.filter((i) => i.next);
  const caughtUp = items.filter((i) => !i.next);

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="label-tag mb-2">The Marquee</div>
        <h1 className="font-display text-4xl font-semibold tracking-tightest-3">
          Nothing followed yet
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Find a show and follow it — its next episode shows up here.
        </p>
        <Link
          href="/search"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-wider text-cream transition-opacity hover:opacity-90"
        >
          <Search size={14} strokeWidth={2} /> Search shows
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h1 className="font-display text-3xl font-semibold tracking-tightest-3">Up Next</h1>
          <span className="label-tag">{behind.length} to watch</span>
        </div>
        {behind.length > 0 ? (
          <div className="space-y-3">
            {behind.map((item) => (
              <UpNextCard key={item.show.tmdbId} item={item} />
            ))}
          </div>
        ) : (
          <p className="card border border-hairline p-6 text-sm text-muted">
            All caught up. Nothing aired that you haven&apos;t seen.
          </p>
        )}
      </section>

      {caughtUp.length > 0 ? (
        <section>
          <div className="label-tag mb-3">Caught up · {caughtUp.length}</div>
          <div className="flex flex-wrap gap-2">
            {caughtUp.map((item) => (
              <Link
                key={item.show.tmdbId}
                href={`/show/${item.show.tmdbId}`}
                className="rounded-full border border-hairline bg-card px-3 py-1.5 text-xs text-muted transition-colors hover:text-ink"
              >
                {item.show.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
