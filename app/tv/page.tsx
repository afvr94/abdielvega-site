import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getHome } from '@/lib/tv/queries';
import { imageUrl } from '@/lib/tv/tmdb';
import { episodeCode, dayHeading, todayIso } from '@/lib/tv/format';
import { UpNextList } from '@/components/tv/UpNextList';
import { SurpriseButton } from '@/components/tv/SurpriseButton';
import { UpNextSummary } from '@/components/tv/UpNextSummary';

export const metadata = { title: 'Up Next' };

export default async function TvHomePage() {
  const db = await createClient();
  const { upNext: items, thisWeek, behindMinutes, dormantCount } = await getHome(db);
  const behind = items.filter((i) => i.next);
  const caughtUp = items.filter((i) => !i.next);
  const today = todayIso();

  if (items.length === 0 && thisWeek.length === 0 && dormantCount === 0) {
    return (
      <div className="py-24 text-center">
        <div className="mb-2 label-tag">cliffo</div>
        <h1 className="font-display text-4xl font-semibold tracking-tightest-3">
          Nothing followed yet
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Find a show and follow it — its next episode shows up here.
        </p>
        <Link
          href="/search"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-income px-5 py-3 text-xs font-semibold tracking-wider text-cream uppercase transition-opacity hover:opacity-90"
        >
          <Search size={14} strokeWidth={2} /> Search shows
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <UpNextSummary
          behind={behind}
          thisWeek={thisWeek}
          behindMinutes={behindMinutes}
          today={today}
        />

        {dormantCount > 0 ? (
          <Link
            href="/shows?filter=dormant"
            className="flex items-center justify-between gap-3 rounded-full border border-hairline bg-card px-4 py-2.5 text-xs text-muted transition-colors hover:text-ink"
          >
            <span>
              {dormantCount} {dormantCount === 1 ? 'show' : 'shows'} untouched for 6 months
            </span>
            <span className="font-semibold text-ink">Review</span>
          </Link>
        ) : null}
      </div>

      {thisWeek.length > 0 ? (
        <section>
          <div className="mb-3 label-tag">Airing this week</div>
          <div className="-mx-5 no-scrollbar flex gap-3 overflow-x-auto px-5 pb-1">
            {thisWeek.map(({ show, episode }) => {
              const img = imageUrl(show.backdropPath, 'w300') ?? imageUrl(show.posterPath, 'w185');
              return (
                <Link key={episode.tmdbId} href={`/show/${show.tmdbId}`} className="w-40 shrink-0">
                  <div className="relative aspect-video overflow-hidden rounded-lg bg-cream">
                    {img ? (
                      <Image src={img} alt="" fill sizes="160px" className="object-cover" />
                    ) : null}
                    <span className="absolute top-1.5 right-1.5 rounded-full bg-black/70 px-1.5 py-0.5 font-mono-tab text-[10px] font-semibold text-white">
                      {episode.airDate === today ? 'Today' : dayHeading(episode.airDate ?? '')}
                    </span>
                  </div>
                  <div className="mt-1.5 truncate text-xs leading-tight font-medium">
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

      <section id="up-next" className="scroll-mt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-tightest-3">Up Next</h1>
          <div className="flex items-center gap-2">
            <SurpriseButton showIds={behind.map((i) => i.show.tmdbId)} />
            <span className="shrink-0 label-tag">{behind.length} to watch</span>
          </div>
        </div>
        {behind.length > 0 ? (
          <UpNextList items={behind} />
        ) : (
          <p className="card border border-hairline p-6 text-sm text-muted">
            All caught up. Nothing aired that you haven&apos;t seen.
          </p>
        )}
      </section>

      {caughtUp.length > 0 ? (
        <section>
          <div className="mb-3 label-tag">Caught up · {caughtUp.length}</div>
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
