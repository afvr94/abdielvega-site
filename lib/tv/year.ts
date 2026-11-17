import type { TmdbSeason } from './tmdb';
import type { YearInReview } from './types';

export type BestEpisode = {
  showTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
  name: string | null;
  voteAverage: number;
};

// TMDB averages from a handful of votes swing wildly, so a score needs this many to count.
const MIN_VOTES = 5;

export function pickBestEpisodes(
  watched: YearInReview['topWatched'],
  seasons: { showTmdbId: number; season: TmdbSeason }[],
  limit = 5
): BestEpisode[] {
  const seen = new Set(watched.map(([s, se, e]) => `${s}:${se}:${e}`));
  return seasons
    .flatMap(({ showTmdbId, season }) =>
      season.episodes
        .filter(
          (e) =>
            seen.has(`${showTmdbId}:${e.season_number}:${e.episode_number}`) &&
            (e.vote_count ?? 0) >= MIN_VOTES
        )
        .map((e) => ({
          showTmdbId,
          seasonNumber: e.season_number,
          episodeNumber: e.episode_number,
          name: e.name,
          voteAverage: e.vote_average ?? 0,
        }))
    )
    .sort((a, b) => b.voteAverage - a.voteAverage)
    .slice(0, limit);
}
