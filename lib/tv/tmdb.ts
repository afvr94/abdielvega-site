// Thin wrapper over the TMDB v3 REST API using a v4 bearer token.

import type { Provider } from './types';

const BASE = 'https://api.themoviedb.org/3';
const DAY = 86_400;
const IMG = 'https://image.tmdb.org/t/p';

function bearer(): string {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) throw new Error('TMDB_ACCESS_TOKEN is not set');
  return token;
}

async function tmdb<T>(
  path: string,
  params?: Record<string, string | number>,
  revalidate?: number
): Promise<T> {
  const url = new URL(BASE + path);
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, String(value));
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${bearer()}`, accept: 'application/json' },
    ...(revalidate ? { next: { revalidate } } : { cache: 'no-store' }),
  });
  if (!res.ok) {
    throw new Error(`TMDB ${path} → ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function imageUrl(path: string | null | undefined, size = 'w342'): string | null {
  return path ? `${IMG}/${size}${path}` : null;
}

// ── Response shapes (only the fields we persist) ─────────────────────────────

export type TmdbSearchResult = {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string | null;
  overview: string | null;
};

export type TmdbSeasonSummary = {
  season_number: number;
  episode_count: number;
};

export type TmdbShow = {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  status: string | null;
  first_air_date: string | null;
  number_of_episodes: number | null;
  seasons: TmdbSeasonSummary[];
};

export type TmdbEpisode = {
  id: number;
  season_number: number;
  episode_number: number;
  name: string | null;
  overview: string | null;
  air_date: string | null;
  still_path: string | null;
  runtime: number | null;
};

export type TmdbSeason = {
  season_number: number;
  episodes: TmdbEpisode[];
};

export type TmdbExternalIds = {
  imdb_id: string | null;
  tvdb_id: number | null;
};

// ── Endpoints ────────────────────────────────────────────────────────────────

export function searchTv(query: string): Promise<{ results: TmdbSearchResult[] }> {
  return tmdb('/search/tv', { query, include_adult: 'false' });
}

export function getShow(seriesId: number): Promise<TmdbShow> {
  return tmdb(`/tv/${seriesId}`);
}

export function getSeason(seriesId: number, seasonNumber: number): Promise<TmdbSeason> {
  return tmdb(`/tv/${seriesId}/season/${seasonNumber}`);
}

export function getExternalIds(seriesId: number): Promise<TmdbExternalIds> {
  return tmdb(`/tv/${seriesId}/external_ids`);
}

// Resolve a TheTVDB series id (TV Time's `s_id`) straight to a TMDB show.
export async function findByTvdbId(tvdbId: number): Promise<TmdbSearchResult | null> {
  const data = await tmdb<{ tv_results: TmdbSearchResult[] }>(`/find/${tvdbId}`, {
    external_source: 'tvdb_id',
  });
  return data.tv_results[0] ?? null;
}

// ── Watch providers (JustWatch data via TMDB) ────────────────────────────────

type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
};
type TmdbRegionProviders = {
  link?: string;
  flatrate?: TmdbProvider[];
  free?: TmdbProvider[];
  ads?: TmdbProvider[];
};
export type TmdbWatchProviders = { results: Record<string, TmdbRegionProviders> };

export type WatchProvider = { name: string; logoUrl: string | null };

// Streaming ("where it's available") providers for a region — subscription,
// free, and ad-supported, deduped and ordered by TMDB display priority.
export function streamingProviders(data: TmdbWatchProviders, region = 'US'): Provider[] {
  const r = data.results?.[region];
  if (!r) return [];
  const seen = new Set<number>();
  return [...(r.flatrate ?? []), ...(r.free ?? []), ...(r.ads ?? [])]
    .sort((a, b) => a.display_priority - b.display_priority)
    .filter((p) => (seen.has(p.provider_id) ? false : (seen.add(p.provider_id), true)))
    .map((p) => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path }));
}

export function pickStreamingProviders(
  data: TmdbWatchProviders,
  region = 'US'
): { providers: WatchProvider[]; link: string | null } {
  return {
    providers: streamingProviders(data, region).map((p) => ({
      name: p.name,
      logoUrl: imageUrl(p.logoPath, 'w92'),
    })),
    link: data.results?.[region]?.link ?? null,
  };
}

// Cached for a day — availability changes slowly.
export function fetchWatchProviders(seriesId: number): Promise<TmdbWatchProviders> {
  return tmdb<TmdbWatchProviders>(`/tv/${seriesId}/watch/providers`, {}, DAY);
}

export async function getWatchProviders(
  seriesId: number,
  region = 'US'
): Promise<{ providers: WatchProvider[]; link: string | null }> {
  return pickStreamingProviders(await fetchWatchProviders(seriesId), region);
}

export type Score = { voteAverage: number; voteCount: number };

export type ShowReview = {
  author: string;
  rating: number | null;
  excerpt: string;
  url: string;
};

type TmdbVotes = { vote_average?: number; vote_count?: number };

const toScore = (r: TmdbVotes): Score | null =>
  r.vote_count ? { voteAverage: r.vote_average ?? 0, voteCount: r.vote_count } : null;

export async function getEpisodeScore(
  seriesId: number,
  season: number,
  episode: number
): Promise<Score | null> {
  const r = await tmdb<TmdbVotes>(`/tv/${seriesId}/season/${season}/episode/${episode}`, {}, DAY);
  return toScore(r);
}

export async function getShowReception(
  seriesId: number
): Promise<{ score: Score | null; reviews: ShowReview[] }> {
  const [show, reviews] = await Promise.allSettled([
    tmdb<TmdbVotes>(`/tv/${seriesId}`, {}, DAY),
    tmdb<{
      results?: {
        author: string;
        content: string;
        url: string;
        author_details?: { rating?: number | null };
      }[];
    }>(`/tv/${seriesId}/reviews`, {}, DAY),
  ]);
  return {
    score: show.status === 'fulfilled' ? toScore(show.value) : null,
    reviews: (reviews.status === 'fulfilled' ? (reviews.value.results ?? []) : [])
      .slice(0, 3)
      .map((r) => ({
        author: r.author,
        rating: r.author_details?.rating ?? null,
        excerpt:
          [...r.content].length > 400
            ? `${[...r.content].slice(0, 400).join('').trimEnd()}…`
            : r.content,
        url: r.url,
      })),
  };
}
