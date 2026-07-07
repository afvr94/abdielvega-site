export type Show = {
  tmdbId: number;
  tvdbId: number | null;
  name: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string | null;
  status: string | null;
  firstAirDate: string | null;
  lastSyncedAt: string | null;
};

export type Episode = {
  tmdbId: number;
  showTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
  name: string | null;
  overview: string | null;
  airDate: string | null;
  stillPath: string | null;
  runtime: number | null;
};

// One followed show on the Up Next screen: its next aired-but-unwatched episode
// (null when caught up) plus aired progress.
export type UpNextItem = {
  show: Show;
  next: Episode | null;
  airedTotal: number;
  airedWatched: number;
};

// A followed show in the /shows library grid.
export type LibraryItem = {
  show: Show;
  archived: boolean;
  airedTotal: number;
  airedWatched: number;
  nextAirDate: string | null; // earliest future episode, for "returns" hints
};

// A future episode on the calendar.
export type UpcomingEpisode = {
  show: Show;
  episode: Episode;
};

// Everything the show detail page needs, read in one pass.
export type ShowDetail = {
  show: Show;
  episodes: Episode[];
  watched: Set<string>; // `${season}-${episode}` keys
  isFollowed: boolean;
  archived: boolean;
};

export function watchKey(season: number, episode: number): string {
  return `${season}-${episode}`;
}
