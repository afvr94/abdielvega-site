import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Episode,
  LibraryItem,
  Show,
  ShowDetail,
  Stats,
  TvList,
  TvListWithCount,
  UpcomingEpisode,
  UpNextItem,
} from './types';
import { watchKey } from './types';
import { addDaysIso, todayIso } from './format';

const SHOW_COLUMNS = 'tmdb_id,name,poster_path,backdrop_path,status,first_air_date';
const EPISODE_COLUMNS =
  'tmdb_id,show_tmdb_id,season_number,episode_number,name,air_date,still_path';

type ShowRow = {
  tmdb_id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  status: string | null;
  first_air_date: string | null;
};

type EpisodeRow = {
  tmdb_id: number;
  show_tmdb_id: number;
  season_number: number;
  episode_number: number;
  name: string | null;
  air_date: string | null;
  still_path: string | null;
};

function mapShow(r: ShowRow): Show {
  return {
    tmdbId: r.tmdb_id,
    name: r.name,
    posterPath: r.poster_path,
    backdropPath: r.backdrop_path,
    status: r.status,
    firstAirDate: r.first_air_date,
  };
}

function mapEpisode(r: EpisodeRow): Episode {
  return {
    tmdbId: r.tmdb_id,
    showTmdbId: r.show_tmdb_id,
    seasonNumber: r.season_number,
    episodeNumber: r.episode_number,
    name: r.name,
    airDate: r.air_date,
    stillPath: r.still_path,
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

type HomeJson = {
  up_next: { show: ShowRow; next: EpisodeRow | null; aired_total: number; aired_watched: number }[];
  this_week: { show: ShowRow; episode: EpisodeRow }[];
};

// The Up Next page in one round trip: the feed (one entry per active show with
// aired episodes) and the next 7 days of airings. See tv_home() in DEPLOY.md.
export async function getHome(
  db: SupabaseClient
): Promise<{ upNext: UpNextItem[]; thisWeek: UpcomingEpisode[] }> {
  const { data, error } = await db.rpc('tv_home');
  if (error) throw error;
  const home = data as HomeJson;

  const upNext: UpNextItem[] = home.up_next.map((r) => ({
    show: mapShow(r.show),
    next: r.next ? mapEpisode(r.next) : null,
    airedTotal: r.aired_total,
    airedWatched: r.aired_watched,
  }));
  // Behind shows (something to watch) first, most recently aired next episode on top.
  upNext.sort((a, b) => {
    if (!!a.next !== !!b.next) return a.next ? -1 : 1;
    const ad = a.next?.airDate ?? '';
    const bd = b.next?.airDate ?? '';
    return bd.localeCompare(ad);
  });

  return {
    upNext,
    thisWeek: home.this_week.map((r) => ({
      show: mapShow(r.show),
      episode: mapEpisode(r.episode),
    })),
  };
}

export async function getShowDetail(
  db: SupabaseClient,
  tmdbId: number
): Promise<ShowDetail | null> {
  const [showRes, episodeRows, watchRows, followRow, allListsRes, memberRes] = await Promise.all([
    db.from('tv_shows').select(SHOW_COLUMNS).eq('tmdb_id', tmdbId).maybeSingle(),
    fetchAll<EpisodeRow>(db, (from, to) =>
      db
        .from('tv_episodes')
        .select(EPISODE_COLUMNS)
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
    db.from('tv_follows').select('archived,watchlist').eq('show_tmdb_id', tmdbId).maybeSingle(),
    db.from('tv_lists').select('id,name').order('name'),
    db.from('tv_list_shows').select('list_id').eq('show_tmdb_id', tmdbId),
  ]);
  if (showRes.error) throw showRes.error;
  if (!showRes.data) return null;
  if (followRow.error) throw followRow.error;
  if (allListsRes.error) throw allListsRes.error;
  if (memberRes.error) throw memberRes.error;

  const follow = followRow.data as { archived: boolean; watchlist: boolean } | null;
  return {
    show: mapShow(showRes.data as ShowRow),
    episodes: episodeRows.map(mapEpisode),
    watched: new Set(watchRows.map((w) => watchKey(w.season_number, w.episode_number))),
    isFollowed: follow !== null,
    archived: follow?.archived ?? false,
    watchlist: follow?.watchlist ?? false,
    allLists: (allListsRes.data ?? []) as TvList[],
    listIds: ((memberRes.data ?? []) as { list_id: number }[]).map((r) => r.list_id),
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
  by_day: { date: string; count: number }[];
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
    byDay: (d.by_day ?? []).map((r) => ({ date: String(r.date), count: Number(r.count) })),
    topShows: (d.top_shows ?? []).map((r) => ({
      showTmdbId: Number(r.show_tmdb_id),
      name: r.name,
      count: Number(r.count),
      runtimeMin: Number(r.runtime_min),
    })),
  };
}

// Actively-followed shows: not archived and not on the watchlist.
export async function getActiveFollowIds(db: SupabaseClient): Promise<number[]> {
  const { data, error } = await db
    .from('tv_follows')
    .select('show_tmdb_id')
    .eq('archived', false)
    .eq('watchlist', false);
  if (error) throw error;
  return (data ?? []).map((r: { show_tmdb_id: number }) => r.show_tmdb_id);
}

type LibraryRpcRow = {
  show_tmdb_id: number;
  archived: boolean;
  watchlist: boolean;
  aired_total: number;
  aired_watched: number;
  next_air_date: string | null;
  last_watched_at: string | null;
};

// All custom lists with their member counts.
export async function getLists(db: SupabaseClient): Promise<TvListWithCount[]> {
  const [listRes, memberRes] = await Promise.all([
    db.from('tv_lists').select('id,name').order('name'),
    db.from('tv_list_shows').select('list_id'),
  ]);
  if (listRes.error) throw listRes.error;
  if (memberRes.error) throw memberRes.error;
  const counts = new Map<number, number>();
  for (const m of (memberRes.data ?? []) as { list_id: number }[]) {
    counts.set(m.list_id, (counts.get(m.list_id) ?? 0) + 1);
  }
  return ((listRes.data ?? []) as TvList[]).map((l) => ({
    id: l.id,
    name: l.name,
    count: counts.get(l.id) ?? 0,
  }));
}

async function listIdsByShow(db: SupabaseClient): Promise<Map<number, number[]>> {
  const rows = await fetchAll<{ list_id: number; show_tmdb_id: number }>(db, (from, to) =>
    db.from('tv_list_shows').select('list_id,show_tmdb_id').range(from, to)
  );
  const map = new Map<number, number[]>();
  for (const r of rows) map.set(r.show_tmdb_id, [...(map.get(r.show_tmdb_id) ?? []), r.list_id]);
  return map;
}

// Every followed show (archived included) with aired progress + next air date.
export async function getLibrary(db: SupabaseClient): Promise<LibraryItem[]> {
  const { data, error } = await db.rpc('tv_library');
  if (error) throw error;
  const rows = (data ?? []) as LibraryRpcRow[];
  if (rows.length === 0) return [];

  const [{ data: showData, error: showErr }, listMap] = await Promise.all([
    db
      .from('tv_shows')
      .select(SHOW_COLUMNS)
      .in(
        'tmdb_id',
        rows.map((r) => r.show_tmdb_id)
      ),
    listIdsByShow(db),
  ]);
  if (showErr) throw showErr;
  const shows = new Map((showData as ShowRow[]).map((r) => [r.tmdb_id, mapShow(r)]));

  const items: LibraryItem[] = [];
  for (const r of rows) {
    const show = shows.get(r.show_tmdb_id);
    if (!show) continue;
    items.push({
      show,
      archived: r.archived,
      watchlist: r.watchlist ?? false,
      airedTotal: Number(r.aired_total),
      airedWatched: Number(r.aired_watched),
      nextAirDate: r.next_air_date,
      lastWatchedAt: r.last_watched_at ?? null,
      listIds: listMap.get(r.show_tmdb_id) ?? [],
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

  const today = todayIso();
  const end = addDaysIso(today, days);

  const epRows = await fetchAll(db, (from, to) =>
    db
      .from('tv_episodes')
      .select(`${EPISODE_COLUMNS},show:tv_shows(${SHOW_COLUMNS})`)
      .in('show_tmdb_id', ids)
      .gt('season_number', 0)
      .gte('air_date', today)
      .lte('air_date', end)
      .order('air_date')
      .range(from, to)
      // The client has no schema types, so the select parser assumes embeds are
      // arrays. A many-to-one embed comes back as one object.
      .overrideTypes<(EpisodeRow & { show: ShowRow | null })[], { merge: false }>()
  );

  const out: UpcomingEpisode[] = [];
  for (const e of epRows) {
    if (e.show) out.push({ show: mapShow(e.show), episode: mapEpisode(e) });
  }
  return out;
}
