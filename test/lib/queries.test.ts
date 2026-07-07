import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getUpNext, getShowDetail, getLibrary, getStats } from '@/lib/tv/queries';

// Minimal chainable stand-in for the Supabase query builder. Each method that
// filters is honored so getShowDetail's per-show reads behave; everything
// resolves to { data, error } and is awaitable via `then`.
function makeBuilder(rows: Record<string, unknown>[]) {
  let state = [...rows];
  const b: Record<string, unknown> = {};
  Object.assign(b, {
    select: () => b,
    in: (col: string, vals: unknown[]) => {
      state = state.filter((r) => vals.includes(r[col]));
      return b;
    },
    eq: (col: string, val: unknown) => {
      state = state.filter((r) => r[col] === val);
      return b;
    },
    gt: () => b,
    lte: () => b,
    not: () => b,
    or: () => b,
    order: () => b,
    range: () => b,
    maybeSingle: () => Promise.resolve({ data: state[0] ?? null, error: null }),
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve({ data: state, error: null }).then(res, rej),
  });
  return b;
}

function makeDb(config: {
  rpc?: Record<string, unknown>;
  tables?: Record<string, Record<string, unknown>[]>;
}): SupabaseClient {
  return {
    rpc: (name: string) => Promise.resolve({ data: config.rpc?.[name] ?? [], error: null }),
    from: (table: string) => makeBuilder(config.tables?.[table] ?? []),
  } as unknown as SupabaseClient;
}

const show = (tmdb_id: number, name: string, extra: Record<string, unknown> = {}) => ({
  tmdb_id,
  tvdb_id: null,
  name,
  poster_path: null,
  backdrop_path: null,
  overview: null,
  status: null,
  first_air_date: null,
  last_synced_at: null,
  ...extra,
});

describe('getUpNext', () => {
  it('returns [] when the RPC has no rows', async () => {
    const db = makeDb({ rpc: { tv_up_next: [] } });
    expect(await getUpNext(db)).toEqual([]);
  });

  it('orders behind shows first (by most recent air), caught-up last', async () => {
    const db = makeDb({
      rpc: {
        tv_up_next: [
          {
            show_tmdb_id: 1,
            episode_tmdb_id: 101,
            season_number: 1,
            episode_number: 2,
            aired_total: 10,
            aired_watched: 1,
          },
          {
            show_tmdb_id: 2,
            episode_tmdb_id: null,
            season_number: null,
            episode_number: null,
            aired_total: 5,
            aired_watched: 5,
          },
          {
            show_tmdb_id: 3,
            episode_tmdb_id: 103,
            season_number: 1,
            episode_number: 3,
            aired_total: 8,
            aired_watched: 2,
          },
        ],
      },
      tables: {
        tv_shows: [show(1, 'A'), show(2, 'B'), show(3, 'C')],
        tv_episodes: [
          {
            tmdb_id: 101,
            show_tmdb_id: 1,
            season_number: 1,
            episode_number: 2,
            name: 'a',
            overview: null,
            air_date: '2026-06-01',
            still_path: null,
            runtime: null,
          },
          {
            tmdb_id: 103,
            show_tmdb_id: 3,
            season_number: 1,
            episode_number: 3,
            name: 'c',
            overview: null,
            air_date: '2026-05-01',
            still_path: null,
            runtime: null,
          },
        ],
      },
    });
    const items = await getUpNext(db);
    expect(items.map((i) => i.show.name)).toEqual(['A', 'C', 'B']);
    expect(items[0].next?.airDate).toBe('2026-06-01');
    expect(items[0].airedWatched).toBe(1);
    expect(items[0].airedTotal).toBe(10);
    expect(items[2].next).toBeNull(); // caught up
  });
});

describe('getLibrary', () => {
  it('orders by last watched (recent first); unwatched fall to the bottom, alphabetically', async () => {
    const db = makeDb({
      rpc: {
        tv_library: [
          {
            show_tmdb_id: 1,
            archived: false,
            aired_total: 10,
            aired_watched: 5,
            next_air_date: null,
            last_watched_at: '2026-07-01T00:00:00Z',
          },
          {
            show_tmdb_id: 2,
            archived: false,
            aired_total: 3,
            aired_watched: 0,
            next_air_date: null,
            last_watched_at: null,
          },
          {
            show_tmdb_id: 3,
            archived: false,
            aired_total: 8,
            aired_watched: 8,
            next_air_date: null,
            last_watched_at: '2026-07-05T00:00:00Z',
          },
          {
            show_tmdb_id: 4,
            archived: false,
            aired_total: 2,
            aired_watched: 0,
            next_air_date: null,
            last_watched_at: null,
          },
        ],
      },
      tables: {
        tv_shows: [show(1, 'Zeta'), show(2, 'Alpha'), show(3, 'Beta'), show(4, 'Xray')],
      },
    });
    const items = await getLibrary(db);
    expect(items.map((i) => i.show.name)).toEqual(['Beta', 'Zeta', 'Alpha', 'Xray']);
    expect(items[0].lastWatchedAt).toBe('2026-07-05T00:00:00Z');
  });
});

describe('getStats', () => {
  it('maps the tv_stats json blob to camelCase', async () => {
    const db = makeDb({
      rpc: {
        tv_stats: {
          total_watches: 9419,
          total_runtime_min: 240000,
          shows_followed: 34,
          shows_archived: 5,
          first_watch: '2018-05-20T23:10:58Z',
          last_watch: '2026-07-07T00:00:00Z',
          by_year: [
            { year: 2018, count: 100 },
            { year: 2019, count: 200 },
          ],
          top_shows: [{ show_tmdb_id: 1, name: 'Arrow', count: 170, runtime_min: 6800 }],
        },
      },
    });
    const s = await getStats(db);
    expect(s.totalWatches).toBe(9419);
    expect(s.totalRuntimeMin).toBe(240000);
    expect(s.showsFollowed).toBe(34);
    expect(s.showsArchived).toBe(5);
    expect(s.firstWatch).toBe('2018-05-20T23:10:58Z');
    expect(s.byYear).toEqual([
      { year: 2018, count: 100 },
      { year: 2019, count: 200 },
    ]);
    expect(s.topShows[0]).toEqual({
      showTmdbId: 1,
      name: 'Arrow',
      count: 170,
      runtimeMin: 6800,
    });
  });
});

describe('getShowDetail', () => {
  it('returns null when the show is not cached', async () => {
    const db = makeDb({ tables: { tv_shows: [] } });
    expect(await getShowDetail(db, 999)).toBeNull();
  });

  it('maps rows to camelCase and builds the watched set + follow state', async () => {
    const db = makeDb({
      tables: {
        tv_shows: [show(1, 'A', { poster_path: '/p.jpg', status: 'Ended' })],
        tv_episodes: [
          {
            tmdb_id: 11,
            show_tmdb_id: 1,
            season_number: 1,
            episode_number: 1,
            name: 'e1',
            overview: null,
            air_date: '2026-01-01',
            still_path: null,
            runtime: 22,
          },
          {
            tmdb_id: 12,
            show_tmdb_id: 1,
            season_number: 1,
            episode_number: 2,
            name: 'e2',
            overview: null,
            air_date: '2026-01-08',
            still_path: null,
            runtime: 22,
          },
        ],
        tv_watches: [{ show_tmdb_id: 1, season_number: 1, episode_number: 1 }],
        tv_follows: [{ show_tmdb_id: 1, archived: true }],
      },
    });
    const detail = await getShowDetail(db, 1);
    expect(detail).not.toBeNull();
    expect(detail!.show.name).toBe('A');
    expect(detail!.show.posterPath).toBe('/p.jpg');
    expect(detail!.episodes).toHaveLength(2);
    expect(detail!.episodes[0].episodeNumber).toBe(1);
    expect(detail!.watched.has('1-1')).toBe(true);
    expect(detail!.watched.has('1-2')).toBe(false);
    expect(detail!.isFollowed).toBe(true);
    expect(detail!.archived).toBe(true);
  });
});
