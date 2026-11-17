import Link from 'next/link';
import { getSeason } from '@/lib/tv/tmdb';
import { episodeCode } from '@/lib/tv/format';
import { pickBestEpisodes } from '@/lib/tv/year';
import type { YearInReview } from '@/lib/tv/types';

const DAY = 86_400;
const SEASONS_PER_SHOW = 3;

// Scores aren't stored, so this streams in after the year from TMDB, cached for a day.
export async function YearBestEpisodes({ year }: { year: YearInReview }) {
  // A watched show may not be cached in tv_shows yet; it has no name and no top-shows row.
  const names = new Map(year.topShows.map((s) => [s.showTmdbId, s.name]));
  const watched = year.topWatched.filter(([s]) => names.has(s));
  // A per-show cap, so one long-running show can't crowd the others out of the fetch.
  const pairs = year.topShows.flatMap(({ showTmdbId }) =>
    [...new Set(watched.filter(([s]) => s === showTmdbId).map(([, se]) => se))]
      .slice(0, SEASONS_PER_SHOW)
      .map((se) => [showTmdbId, se] as [number, number])
  );
  const seasons = (
    await Promise.all(
      pairs.map(([showTmdbId, n]) =>
        getSeason(showTmdbId, n, DAY).then(
          (season) => ({ showTmdbId, season }),
          () => null
        )
      )
    )
  ).filter((s) => s !== null);
  const best = pickBestEpisodes(watched, seasons);
  if (best.length === 0) return null;

  return (
    <div>
      <div className="mb-2 label-tag">Best-rated episodes you watched</div>
      <div className="space-y-1.5">
        {best.map((e) => (
          <Link
            key={`${e.showTmdbId}-${e.seasonNumber}-${e.episodeNumber}`}
            href={`/show/${e.showTmdbId}`}
            className="flex items-center gap-3 card border border-hairline p-2.5 transition-colors hover:border-ink/25"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-display leading-tight font-semibold">
                {names.get(e.showTmdbId)}
              </div>
              <div className="truncate text-[11px] text-muted">
                <span className="font-mono-tab">
                  {episodeCode(e.seasonNumber, e.episodeNumber)}
                </span>
                {e.name ? ` · ${e.name}` : ''}
              </div>
            </div>
            <span className="shrink-0 font-mono-tab text-sm text-income">
              ★ {e.voteAverage.toFixed(1)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
