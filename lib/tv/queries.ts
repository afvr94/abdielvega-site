import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Episode,
  LibraryItem,
  Show,
  ShowDetail,
  Stats,
  UpcomingEpisode,
  UpNextItem,
} from './types';
import { watchKey } from './types';

type ShowRow = {
  tmdb_id: number;
  tvdb_id: number | null;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  status: string | null;
  first_air_date: string | null;
  last_synced_at: string | null;
};

type EpisodeRow = {
  tmdb_id: number;
  show_tmdb_id: number;
  season_number: number;
  episode_number: number;
  name: string | null;
  overview: string | null;
  air_date: string | null;
  still_path: string | null;
  runtime: number | null;
};

function mapShow(r: ShowRow): Show {
  return {
    tmdbId: r.tmdb_id,
    tvdbId: r.tvdb_id,
    name: r.name,
    posterPath: r.poster_path,
    backdropPath: r.backdrop_path,
    overview: r.overview,
    status: r.status,
    firstAirDate: r.first_air_date,
    lastSyncedAt: r.last_synced_at,
  };
}

function mapEpisode(r: EpisodeRow): Episode {
  return {
    tmdbId: r.tmdb_id,
    showTmdbId: r.show_tmdb_id,
    seasonNumber: r.season_number,
    episodeNumber: r.episode_number,
    name: r.name,
    overview: r.overview,
    airDate: r.air_date,
    stillPath: r.still_path,
    runtime: r.runtime,
  };
}

// PostgREST caps a single response (default 1000 rows); page through everything.
async function fetchAll<T>(
  db: SupabaseClient,
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const PAGE = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    const batch = data ?? [];
    out.push(...batch);
    if (batch.length < PAGE) break;
  }
  return out;
}

type UpNextRpcRow = {
  show_tmdb_id: number;
  episode_tmdb_id: number | null;
  season_number: number | null;
  episode_number: number | null;
  aired_total: number;
  aired_watched: number;
};

// Up Next feed: one entry per followed, non-archived show that has aired
// episodes. Ordering + gap handling live in the tv_up_next() SQL function.
export async function getUpNext(db: SupabaseClient): Promise<UpNextItem[]> {
  const { data, error } = await db.rpc('tv_up_next');
  if (error) throw error;
  const rows = (data ?? []) as UpNextRpcRow[];
  if (rows.length === 0) return [];

  const showIds = rows.map((r) => r.show_tmdb_id);
  const episodeIds = rows.map((r) => r.episode_tmdb_id).filter((id): id is number => id !== null);

  const [showRows, epRows] = await Promise.all([
    db.from('tv_shows').select('*').in('tmdb_id', showIds),
    episodeIds.length
      ? db.from('tv_episodes').select('*').in('tmdb_id', episodeIds)
      : Promise.resolve({ data: [] as EpisodeRow[], error: null }),
  ]);
  if (showRows.error) throw showRows.error;
  if (epRows.error) throw epRows.error;

  const shows = new Map((showRows.data as ShowRow[]).map((r) => [r.tmdb_id, mapShow(r)]));
  const eps = new Map((epRows.data as EpisodeRow[]).map((r) => [r.tmdb_id, mapEpisode(r)]));

  const items: UpNextItem[] = [];
  for (const r of rows) {
    const show = shows.get(r.show_tmdb_id);
    if (!show) continue;
    items.push({
      show,
      next: r.episode_tmdb_id ? (eps.get(r.episode_tmdb_id) ?? null) : null,
      airedTotal: Number(r.aired_total),
      airedWatched: Number(r.aired_watched),
    });
  }

  // Behind shows (something to watch) first, most recently aired next episode on top.
  items.sort((a, b) => {
    if (!!a.next !== !!b.next) return a.next ? -1 : 1;
    const ad = a.next?.airDate ?? '';
    const bd = b.next?.airDate ?? '';
    return bd.localeCompare(ad);
  });
  return items;
}

export async function getShowDetail(
  db: SupabaseClient,
  tmdbId: number
): Promise<ShowDetail | null> {
  const { data: showRow, error: showErr } = await db
    .from('tv_shows')
    .select('*')
    .eq('tmdb_id', tmdbId)
    .maybeSingle();
  if (showErr) throw showErr;
  if (!showRow) return null;

  const [episodeRows, watchRows, followRow] = await Promise.all([
    fetchAll<EpisodeRow>(db, (from, to) =>
      db
        .from('tv_episodes')
        .select('*')
        .eq('show_tmdb_id', tmdbId)
        .order('season_number')
        .order('episode_number')
        .range(from, to)
    ),
    fetchAll<{ season_number: number; episode_number: number }>(db, (from, to) =>
      db
        .from('tv_watches')
        .select('season_number,episode_number')
        .eq('show_tmdb_id', tmdbId)
        .range(from, to)
    ),
    db.from('tv_follows').select('archived').eq('show_tmdb_id', tmdbId).maybeSingle(),
  ]);
  if (followRow.error) throw followRow.error;

  return {
    show: mapShow(showRow as ShowRow),
    episodes: episodeRows.map(mapEpisode),
    watched: new Set(watchRows.map((w) => watchKey(w.season_number, w.episode_number))),
    isFollowed: followRow.data !== null,
    archived: followRow.data?.archived ?? false,
  };
}

export async function isFollowing(db: SupabaseClient, tmdbId: number): Promise<boolean> {
  const { data, error } = await db
    .from('tv_follows')
    .select('show_tmdb_id')
    .eq('show_tmdb_id', tmdbId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function getFollowedTmdbIds(db: SupabaseClient): Promise<Set<number>> {
  const { data, error } = await db.from('tv_follows').select('show_tmdb_id');
  if (error) throw error;
  return new Set((data ?? []).map((r: { show_tmdb_id: number }) => r.show_tmdb_id));
}

type StatsJson = {
  total_watches: number;
  total_runtime_min: number;
  shows_followed: number;
  shows_archived: number;
  first_watch: string | null;
  last_watch: string | null;
  by_year: { year: number; count: number }[];
  top_shows: { show_tmdb_id: number; name: string; count: number; runtime_min: number }[];
};

// Aggregated viewing stats — all computed in one tv_stats() SQL call.
export async function getStats(db: SupabaseClient): Promise<Stats> {
  const { data, error } = await db.rpc('tv_stats');
  if (error) throw error;
  const d = (data ?? {}) as StatsJson;
  return {
    totalWatches: Number(d.total_watches ?? 0),
    totalRuntimeMin: Number(d.total_runtime_min ?? 0),
    showsFollowed: Number(d.shows_followed ?? 0),
    showsArchived: Number(d.shows_archived ?? 0),
    firstWatch: d.first_watch ?? null,
    lastWatch: d.last_watch ?? null,
    byYear: (d.by_year ?? []).map((r) => ({ year: Number(r.year), count: Number(r.count) })),
    topShows: (d.top_shows ?? []).map((r) => ({
      showTmdbId: Number(r.show_tmdb_id),
      name: r.name,
      count: Number(r.count),
      runtimeMin: Number(r.runtime_min),
    })),
  };
}

export async function getActiveFollowIds(db: SupabaseClient): Promise<number[]> {
  const { data, error } = await db.from('tv_follows').select('show_tmdb_id').eq('archived', false);
  if (error) throw error;
  return (data ?? []).map((r: { show_tmdb_id: number }) => r.show_tmdb_id);
}

type LibraryRpcRow = {
  show_tmdb_id: number;
  archived: boolean;
  aired_total: number;
  aired_watched: number;
  next_air_date: string | null;
  last_watched_at: string | null;
};

// Every followed show (archived included) with aired progress + next air date.
export async function getLibrary(db: SupabaseClient): Promise<LibraryItem[]> {
  const { data, error } = await db.rpc('tv_library');
  if (error) throw error;
  const rows = (data ?? []) as LibraryRpcRow[];
  if (rows.length === 0) return [];

  const { data: showData, error: showErr } = await db
    .from('tv_shows')
    .select('*')
    .in(
      'tmdb_id',
      rows.map((r) => r.show_tmdb_id)
    );
  if (showErr) throw showErr;
  const shows = new Map((showData as ShowRow[]).map((r) => [r.tmdb_id, mapShow(r)]));

  const items: LibraryItem[] = [];
  for (const r of rows) {
    const show = shows.get(r.show_tmdb_id);
    if (!show) continue;
    items.push({
      show,
      archived: r.archived,
      airedTotal: Number(r.aired_total),
      airedWatched: Number(r.aired_watched),
      nextAirDate: r.next_air_date,
      lastWatchedAt: r.last_watched_at ?? null,
    });
  }
  // Most recently watched first; shows with no watches (null) fall to the
  // bottom, alphabetically. ISO timestamps compare lexicographically.
  items.sort((a, b) => {
    const at = a.lastWatchedAt ?? '';
    const bt = b.lastWatchedAt ?? '';
    if (at !== bt) return bt.localeCompare(at);
    return a.show.name.localeCompare(b.show.name);
  });
  return items;
}

// Future episodes across active (non-archived) follows, within `days`.
export async function getUpcoming(db: SupabaseClient, days = 90): Promise<UpcomingEpisode[]> {
  const ids = await getActiveFollowIds(db);
  if (ids.length === 0) return [];

  const today = new Date().toISOString().slice(0, 10);
  const end = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

  const epRows = await fetchAll<EpisodeRow>(db, (from, to) =>
    db
      .from('tv_episodes')
      .select('*')
      .in('show_tmdb_id', ids)
      .gt('season_number', 0)
      .gte('air_date', today)
      .lte('air_date', end)
      .order('air_date')
      .range(from, to)
  );
  if (epRows.length === 0) return [];

  const showIds = [...new Set(epRows.map((e) => e.show_tmdb_id))];
  const { data: showData, error: showErr } = await db
    .from('tv_shows')
    .select('*')
    .in('tmdb_id', showIds);
  if (showErr) throw showErr;
  const shows = new Map((showData as ShowRow[]).map((r) => [r.tmdb_id, mapShow(r)]));

  const out: UpcomingEpisode[] = [];
  for (const e of epRows) {
    const show = shows.get(e.show_tmdb_id);
    if (show) out.push({ show, episode: mapEpisode(e) });
  }
  return out;
}
