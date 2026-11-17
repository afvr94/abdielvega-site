import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json, Tables } from '@/lib/supabase/database.types';
import type {
  Episode,
  LibraryItem,
  Provider,
  Show,
  ShowDetail,
  Stats,
  TvListWithCount,
  UpcomingEpisode,
  UpNextItem,
} from './types';
import { watchKey } from './types';
import { addDaysIso, todayIso } from './format';

type Db = SupabaseClient<Database>;

const SHOW_COLUMNS = 'tmdb_id,name,poster_path,backdrop_path,status,first_air_date,providers';
const EPISODE_COLUMNS =
  'tmdb_id,show_tmdb_id,season_number,episode_number,name,air_date,still_path';

type ShowRow = Pick<
  Tables<'tv_shows'>,
  'tmdb_id' | 'name' | 'poster_path' | 'backdrop_path' | 'status' | 'first_air_date' | 'providers'
>;

type EpisodeRow = Pick<
  Tables<'tv_episodes'>,
  | 'tmdb_id'
  | 'show_tmdb_id'
  | 'season_number'
  | 'episode_number'
  | 'name'
  | 'air_date'
  | 'still_path'
>;

// tv_shows.providers is jsonb [{id, name, logo_path}], null until the sync first fills it.
function parseProviders(j: Json | null | undefined): Provider[] {
  if (!Array.isArray(j)) return [];
  return j.flatMap((p) =>
    p &&
    typeof p === 'object' &&
    !Array.isArray(p) &&
    typeof p.id === 'number' &&
    typeof p.name === 'string'
      ? [{ id: p.id, name: p.name, logoPath: typeof p.logo_path === 'string' ? p.logo_path : null }]
      : []
  );
}

function mapShow(r: ShowRow): Show {
  return {
    tmdbId: r.tmdb_id,
    name: r.name,
    posterPath: r.poster_path,
    backdropPath: r.backdrop_path,
    status: r.status,
    firstAirDate: r.first_air_date,
    providers: parseProviders(r.providers),
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
  behind_minutes: number;
  dormant_count: number;
  services: number[];
};

function parseHome(data: unknown): HomeJson {
  if (
    typeof data === 'object' &&
    data !== null &&
    'up_next' in data &&
    Array.isArray(data.up_next) &&
    'this_week' in data &&
    Array.isArray(data.this_week) &&
    'behind_minutes' in data &&
    typeof data.behind_minutes === 'number' &&
    'dormant_count' in data &&
    typeof data.dormant_count === 'number' &&
    'services' in data &&
    Array.isArray(data.services) &&
    data.services.every((id) => typeof id === 'number')
  ) {
    return data as HomeJson;
  }
  throw new Error('tv_home() returned an unexpected shape; re-apply it from DEPLOY.md');
}

export async function getHome(db: Db): Promise<{
  upNext: UpNextItem[];
  thisWeek: UpcomingEpisode[];
  behindMinutes: number;
  dormantCount: number;
  services: number[];
}> {
  const { data, error } = await db.rpc('tv_home');
  if (error) throw error;
  const home = parseHome(data);

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
    behindMinutes: home.behind_minutes,
    dormantCount: home.dormant_count,
    services: home.services,
  };
}

export async function getShowDetail(db: Db, tmdbId: number): Promise<ShowDetail | null> {
  const [showRes, episodeRows, watchRows, followRow, allListsRes, memberRes] = await Promise.all([
    db.from('tv_shows').select(SHOW_COLUMNS).eq('tmdb_id', tmdbId).maybeSingle(),
    fetchAll<EpisodeRow>((from, to) =>
      db
        .from('tv_episodes')
        .select(EPISODE_COLUMNS)
        .eq('show_tmdb_id', tmdbId)
        .order('season_number')
        .order('episode_number')
        .range(from, to)
    ),
    fetchAll<{ season_number: number; episode_number: number }>((from, to) =>
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

  const follow = followRow.data;
  return {
    show: mapShow(showRes.data),
    episodes: episodeRows.map(mapEpisode),
    watched: new Set(watchRows.map((w) => watchKey(w.season_number, w.episode_number))),
    isFollowed: follow !== null,
    archived: follow?.archived ?? false,
    watchlist: follow?.watchlist ?? false,
    allLists: allListsRes.data ?? [],
    listIds: (memberRes.data ?? []).map((r) => r.list_id),
  };
}

export async function isFollowing(db: Db, tmdbId: number): Promise<boolean> {
  const { data, error } = await db
    .from('tv_follows')
    .select('show_tmdb_id')
    .eq('show_tmdb_id', tmdbId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function getFollowedTmdbIds(db: Db): Promise<Set<number>> {
  const { data, error } = await db.from('tv_follows').select('show_tmdb_id');
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.show_tmdb_id));
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
export async function getStats(db: Db): Promise<Stats> {
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
export async function getActiveFollowIds(db: Db): Promise<number[]> {
  const { data, error } = await db
    .from('tv_follows')
    .select('show_tmdb_id')
    .eq('archived', false)
    .eq('watchlist', false);
  if (error) throw error;
  return (data ?? []).map((r) => r.show_tmdb_id);
}

export async function getServices(db: Db): Promise<number[]> {
  const { data, error } = await db.from('tv_settings').select('services').maybeSingle();
  if (error) throw error;
  return data?.services ?? [];
}

// Every service carrying an active follow, most-carried first, with how many follows it carries.
export async function getServiceOptions(db: Db): Promise<{ provider: Provider; shows: number }[]> {
  const ids = await getActiveFollowIds(db);
  if (ids.length === 0) return [];
  const { data, error } = await db.from('tv_shows').select('providers').in('tmdb_id', ids);
  if (error) throw error;
  const byId = new Map<number, { provider: Provider; shows: number }>();
  for (const row of data ?? []) {
    for (const p of parseProviders(row.providers)) {
      const hit = byId.get(p.id);
      if (hit) hit.shows += 1;
      else byId.set(p.id, { provider: p, shows: 1 });
    }
  }
  return [...byId.values()].sort(
    (a, b) => b.shows - a.shows || a.provider.name.localeCompare(b.provider.name)
  );
}

// All custom lists with their member counts.
export async function getLists(db: Db): Promise<TvListWithCount[]> {
  const [listRes, memberRes] = await Promise.all([
    db.from('tv_lists').select('id,name').order('name'),
    db.from('tv_list_shows').select('list_id'),
  ]);
  if (listRes.error) throw listRes.error;
  if (memberRes.error) throw memberRes.error;
  const counts = new Map<number, number>();
  for (const m of memberRes.data ?? []) {
    counts.set(m.list_id, (counts.get(m.list_id) ?? 0) + 1);
  }
  return (listRes.data ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    count: counts.get(l.id) ?? 0,
  }));
}

async function listIdsByShow(db: Db): Promise<Map<number, number[]>> {
  const rows = await fetchAll<{ list_id: number; show_tmdb_id: number }>((from, to) =>
    db.from('tv_list_shows').select('list_id,show_tmdb_id').range(from, to)
  );
  const map = new Map<number, number[]>();
  for (const r of rows) map.set(r.show_tmdb_id, [...(map.get(r.show_tmdb_id) ?? []), r.list_id]);
  return map;
}

// The type generator marks every column a table-returning function returns as non-null, but
// next_air_date and last_watched_at are null for shows with nothing upcoming
// or nothing watched.
type LibraryRpcRow = Omit<
  Database['public']['Functions']['tv_library']['Returns'][number],
  'next_air_date' | 'last_watched_at'
> & { next_air_date: string | null; last_watched_at: string | null };

// Every followed show (archived included) with aired progress + next air date.
export async function getLibrary(db: Db): Promise<LibraryItem[]> {
  const { data, error } = await db.rpc('tv_library');
  if (error) throw error;
  const rows: LibraryRpcRow[] = data ?? [];
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
  const shows = new Map((showData ?? []).map((r) => [r.tmdb_id, mapShow(r)]));

  const items: LibraryItem[] = [];
  for (const r of rows) {
    const show = shows.get(r.show_tmdb_id);
    if (!show) continue;
    items.push({
      show,
      archived: r.archived,
      watchlist: r.watchlist,
      airedTotal: Number(r.aired_total),
      airedWatched: Number(r.aired_watched),
      nextAirDate: r.next_air_date,
      lastWatchedAt: r.last_watched_at,
      dormant: r.dormant,
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
export async function getUpcoming(db: Db, days = 90): Promise<UpcomingEpisode[]> {
  const ids = await getActiveFollowIds(db);
  if (ids.length === 0) return [];

  const today = todayIso();
  const end = addDaysIso(today, days);

  const epRows = await fetchAll((from, to) =>
    db
      .from('tv_episodes')
      .select(`${EPISODE_COLUMNS},show:tv_shows(${SHOW_COLUMNS})`)
      .in('show_tmdb_id', ids)
      .gt('season_number', 0)
      .gte('air_date', today)
      .lte('air_date', end)
      .order('air_date')
      .range(from, to)
  );

  const out: UpcomingEpisode[] = [];
  for (const e of epRows) {
    if (e.show) out.push({ show: mapShow(e.show), episode: mapEpisode(e) });
  }
  return out;
}
