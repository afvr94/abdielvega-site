import type { Episode, LibraryItem, Show, UpNextItem } from '@/lib/tv/types';

export function makeShow(over: Partial<Show> = {}): Show {
  return {
    tmdbId: 1,
    tvdbId: null,
    name: 'Show',
    posterPath: '/p.jpg',
    backdropPath: '/b.jpg',
    overview: null,
    status: null,
    firstAirDate: null,
    lastSyncedAt: null,
    ...over,
  };
}

export function makeEpisode(over: Partial<Episode> = {}): Episode {
  return {
    tmdbId: 100,
    showTmdbId: 1,
    seasonNumber: 1,
    episodeNumber: 1,
    name: 'Episode',
    overview: null,
    airDate: '2026-01-01',
    stillPath: '/s.jpg',
    runtime: 22,
    ...over,
  };
}

export function makeUpNext(over: Partial<UpNextItem> = {}): UpNextItem {
  return { show: makeShow(), next: makeEpisode(), airedTotal: 10, airedWatched: 4, ...over };
}

export function makeLibraryItem(over: Partial<LibraryItem> = {}): LibraryItem {
  return {
    show: makeShow(),
    archived: false,
    watchlist: false,
    airedTotal: 10,
    airedWatched: 0,
    nextAirDate: null,
    lastWatchedAt: null,
    ...over,
  };
}
