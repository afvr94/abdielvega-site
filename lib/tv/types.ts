export type Provider = { id: number; name: string; logoPath: string | null };

export type Show = {
  tmdbId: number;
  name: string;
  posterPath: string | null;
  backdropPath: string | null;
  status: string | null;
  firstAirDate: string | null;
  providers: Provider[];
};

export type Episode = {
  tmdbId: number;
  showTmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
  name: string | null;
  airDate: string | null;
  stillPath: string | null;
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
export type TvList = { id: number; name: string };
export type TvListWithCount = TvList & { count: number };

export type LibraryItem = {
  show: Show;
  archived: boolean;
  watchlist: boolean;
  airedTotal: number;
  airedWatched: number;
  nextAirDate: string | null; // earliest future episode, for "returns" hints
  lastWatchedAt: string | null; // most recent watch, for recency ordering
  dormant: boolean;
  listIds: number[]; // custom lists this show belongs to
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
  watchlist: boolean;
  allLists: TvList[]; // every list (for the add-to-list menu)
  listIds: number[]; // lists this show is in
};

export function watchKey(season: number, episode: number): string {
  return `${season}-${episode}`;
}

export function episodesLeft(items: UpNextItem[]): number {
  return items.reduce((n, i) => n + (i.next ? i.airedTotal - i.airedWatched : 0), 0);
}

// Aggregated viewing stats (computed by the tv_stats() SQL function).
export type Stats = {
  totalWatches: number;
  totalRuntimeMin: number;
  showsFollowed: number;
  showsArchived: number;
  firstWatch: string | null;
  lastWatch: string | null;
  byYear: { year: number; count: number }[];
  byDay: { date: string; count: number }[];
  topShows: { showTmdbId: number; name: string; count: number; runtimeMin: number }[];
};

export type YearInReview = {
  episodes: number;
  runtimeMin: number;
  shows: number;
  newShows: number;
  topShows: {
    showTmdbId: number;
    name: string;
    posterPath: string | null;
    count: number;
    runtimeMin: number;
  }[];
  bingeDay: { date: string; count: number } | null;
  longestStreak: { days: number; start: string } | null;
  bulk: { date: string; count: number }[];
  topWatched: [show: number, season: number, episode: number][];
};

// providers arrive in TMDB display order, so find() picks the top-billed service.
export function myService(providers: Provider[], services: number[]): Provider | null {
  return providers.find((p) => services.includes(p.id)) ?? null;
}
