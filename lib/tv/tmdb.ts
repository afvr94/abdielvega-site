// Thin wrapper over the TMDB v3 REST API using a v4 bearer token.
// All app reads come from Postgres — these calls run only on follow, import,
// and the scheduled sync, never on page render.

const BASE = 'https://api.themoviedb.org/3';
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
export function pickStreamingProviders(
  data: TmdbWatchProviders,
  region = 'US'
): { providers: WatchProvider[]; link: string | null } {
  const r = data.results?.[region];
  if (!r) return { providers: [], link: null };
  const seen = new Set<number>();
  const providers = [...(r.flatrate ?? []), ...(r.free ?? []), ...(r.ads ?? [])]
    .sort((a, b) => a.display_priority - b.display_priority)
    .filter((p) => (seen.has(p.provider_id) ? false : (seen.add(p.provider_id), true)))
    .map((p) => ({ name: p.provider_name, logoUrl: imageUrl(p.logo_path, 'w92') }));
  return { providers, link: r.link ?? null };
}

export async function getWatchProviders(
  seriesId: number,
  region = 'US'
): Promise<{ providers: WatchProvider[]; link: string | null }> {
  // Cached for a day — availability changes slowly and this runs on page view.
  const data = await tmdb<TmdbWatchProviders>(`/tv/${seriesId}/watch/providers`, {}, 86_400);
  return pickStreamingProviders(data, region);
}
