import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUpcoming } from '@/lib/tv/queries';
import type { UpcomingEpisode } from '@/lib/tv/types';
import { imageUrl } from '@/lib/tv/tmdb';
import { dayHeading, episodeCode } from '@/lib/tv/format';

export const metadata = { title: 'Calendar' };

export default async function CalendarPage() {
  const db = await createClient();
  const upcoming = await getUpcoming(db);
  const today = new Date().toISOString().slice(0, 10);

  // Group consecutive (already sorted) episodes by air date.
  const groups: { date: string; items: UpcomingEpisode[] }[] = [];
  for (const item of upcoming) {
    const date = item.episode.airDate!;
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.items.push(item);
    else groups.push({ date, items: [item] });
  }

  return (
    <div>
      <h1 className="mb-5 font-display text-3xl font-semibold tracking-tightest-3">Calendar</h1>

      {groups.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          Nothing scheduled in the next 90 days for your followed shows.
        </p>
      ) : (
        <div className="space-y-7">
          {groups.map((g) => (
            <section key={g.date}>
              <div className="mb-2 flex items-baseline gap-2">
                <h2 className="font-display text-sm font-semibold tracking-tightest-2">
                  {g.date === today ? 'Today' : dayHeading(g.date)}
                </h2>
                <span className="h-px flex-1 bg-hairline" />
              </div>
              <div className="space-y-1.5">
                {g.items.map(({ show, episode }) => {
                  const poster = imageUrl(show.posterPath, 'w185');
                  return (
                    <Link
                      key={episode.tmdbId}
                      href={`/show/${show.tmdbId}`}
                      className="card flex items-center gap-3 border border-hairline p-2.5 transition-colors hover:border-ink/25"
                    >
                      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-cream">
                        {poster ? (
                          <Image src={poster} alt="" fill sizes="40px" className="object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-display font-semibold leading-tight">
                          {show.name}
                        </div>
                        <div className="flex items-baseline gap-2 text-sm">
                          <span className="font-mono-tab text-[11px] text-muted">
                            {episodeCode(episode.seasonNumber, episode.episodeNumber)}
                          </span>
                          <span className="truncate text-ink">{episode.name ?? '—'}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
