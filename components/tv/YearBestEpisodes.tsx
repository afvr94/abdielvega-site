import Link from 'next/link';
import { getSeason } from '@/lib/tv/tmdb';
import { episodeCode } from '@/lib/tv/format';
import { pickBestEpisodes } from '@/lib/tv/year';
import type { YearInReview } from '@/lib/tv/types';

const DAY = 86_400;
const SEASONS_PER_SHOW = 3;

export async function YearBestEpisodes({ year }: { year: YearInReview }) {
  // top_shows only lists shows cached in tv_shows, so building from it skips nameless shows.
  const names = new Map(year.topShows.map((s) => [s.showTmdbId, s.name]));
  // Without a cap, a show watched across many seasons costs one TMDB fetch per season.
  const pairs = year.topShows.flatMap(({ showTmdbId }) =>
    [...new Set(year.topWatched.filter(([s]) => s === showTmdbId).map(([, se]) => se))]
      .sort((a, b) => b - a)
      .slice(0, SEASONS_PER_SHOW)
      .map((se): [number, number] => [showTmdbId, se])
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
  const best = pickBestEpisodes(year.topWatched, seasons);
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
              <span aria-hidden="true">★ </span>
              <span className="sr-only">Rated </span>
              {e.voteAverage.toFixed(1)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
