import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getUpNext, getUpcoming } from '@/lib/tv/queries';
import { imageUrl } from '@/lib/tv/tmdb';
import { episodeCode, dayHeading } from '@/lib/tv/format';
import { UpNextCard } from '@/components/tv/UpNextCard';

export const metadata = { title: 'Up Next' };

export default async function TvHomePage() {
  const db = await createClient();
  const [items, thisWeek] = await Promise.all([getUpNext(db), getUpcoming(db, 7)]);
  const behind = items.filter((i) => i.next);
  const caughtUp = items.filter((i) => !i.next);
  const today = new Date().toISOString().slice(0, 10);

  if (items.length === 0 && thisWeek.length === 0) {
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
      {thisWeek.length > 0 ? (
        <section>
          <div className="label-tag mb-3">Airing this week</div>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {thisWeek.map(({ show, episode }) => {
              const img = imageUrl(episode.stillPath, 'w300') ?? imageUrl(show.posterPath, 'w185');
              return (
                <Link key={episode.tmdbId} href={`/show/${show.tmdbId}`} className="w-40 shrink-0">
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-cream">
                    {img ? (
                      <Image src={img} alt="" fill sizes="160px" className="object-cover" />
                    ) : null}
                    <span className="font-mono-tab absolute right-1.5 top-1.5 rounded-full bg-ink/85 px-1.5 py-0.5 text-[10px] font-semibold text-cream">
                      {episode.airDate === today ? 'Today' : dayHeading(episode.airDate ?? '')}
                    </span>
                  </div>
                  <div className="mt-1.5 truncate text-xs font-medium leading-tight">
                    {show.name}
                  </div>
                  <div className="font-mono-tab text-[10px] text-muted">
                    {episodeCode(episode.seasonNumber, episode.episodeNumber)}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

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
