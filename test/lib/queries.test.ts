import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import {
  getHome,
  getShowDetail,
  getLibrary,
  getStats,
  getLists,
  getUpcoming,
} from '@/lib/tv/queries';

// Minimal chainable stand-in for the Supabase query builder. Each method that
// filters is honored so getShowDetail's per-show reads behave; everything
// resolves to { data, error } and is awaitable via `then`.
function makeBuilder(rows: Record<string, unknown>[], onSelect: (cols: string) => void) {
  let state = [...rows];
  const b: Record<string, unknown> = {};
  Object.assign(b, {
    select: (cols: string) => {
      onSelect(cols);
      return b;
    },
    in: (col: string, vals: unknown[]) => {
      state = state.filter((r) => vals.includes(r[col]));
      return b;
    },
    eq: (col: string, val: unknown) => {
      state = state.filter((r) => r[col] === val);
      return b;
    },
    gt: () => b,
    gte: () => b,
    lte: () => b,
    not: () => b,
    or: () => b,
    order: () => b,
    range: () => b,
    overrideTypes: () => b,
    maybeSingle: () => Promise.resolve({ data: state[0] ?? null, error: null }),
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve({ data: state, error: null }).then(res, rej),
  });
  return b;
}

function makeDb(
  config: {
    rpc?: Record<string, unknown>;
    tables?: Record<string, Record<string, unknown>[]>;
  },
  selects: { table: string; cols: string }[] = []
): SupabaseClient<Database> {
  return {
    rpc: (name: string) => Promise.resolve({ data: config.rpc?.[name] ?? [], error: null }),
    from: (table: string) =>
      makeBuilder(config.tables?.[table] ?? [], (cols) => selects.push({ table, cols })),
  } as unknown as SupabaseClient<Database>;
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

const ep = (tmdb_id: number, show_tmdb_id: number, air_date: string) => ({
  tmdb_id,
  show_tmdb_id,
  season_number: 1,
  episode_number: tmdb_id % 100,
  name: `e${tmdb_id}`,
  air_date,
  still_path: null,
});

describe('getHome', () => {
  it('returns empty lists when nothing is followed', async () => {
    const db = makeDb({
      rpc: { tv_home: { up_next: [], this_week: [], behind_minutes: 0, dormant_count: 0 } },
    });
    expect(await getHome(db)).toEqual({
      upNext: [],
      thisWeek: [],
      behindMinutes: 0,
      dormantCount: 0,
    });
  });

  it('passes the dormant count through', async () => {
    const db = makeDb({
      rpc: { tv_home: { up_next: [], this_week: [], behind_minutes: 0, dormant_count: 90 } },
    });
    expect((await getHome(db)).dormantCount).toBe(90);
  });

  it('throws when tv_home() is an older version without dormant_count', async () => {
    const db = makeDb({ rpc: { tv_home: { up_next: [], this_week: [], behind_minutes: 0 } } });
    await expect(getHome(db)).rejects.toThrow(/tv_home\(\) returned an unexpected shape/);
  });

  it('throws when tv_home() is an older version without behind_minutes', async () => {
    const db = makeDb({ rpc: { tv_home: { up_next: [], this_week: [] } } });
    await expect(getHome(db)).rejects.toThrow(/tv_home\(\) returned an unexpected shape/);
  });

  it('orders behind shows first (by most recent air), caught-up last', async () => {
    const db = makeDb({
      rpc: {
        tv_home: {
          up_next: [
            {
              show: show(1, 'A'),
              next: ep(101, 1, '2026-06-01'),
              aired_total: 10,
              aired_watched: 1,
            },
            { show: show(2, 'B'), next: null, aired_total: 5, aired_watched: 5 },
            {
              show: show(3, 'C'),
              next: ep(103, 3, '2026-05-01'),
              aired_total: 8,
              aired_watched: 2,
            },
          ],
          this_week: [],
          behind_minutes: 0,
          dormant_count: 0,
        },
      },
    });
    const { upNext } = await getHome(db);
    expect(upNext.map((i) => i.show.name)).toEqual(['A', 'C', 'B']);
    expect(upNext[0].next?.airDate).toBe('2026-06-01');
    expect(upNext[0].airedWatched).toBe(1);
    expect(upNext[0].airedTotal).toBe(10);
    expect(upNext[2].next).toBeNull();
  });

  it("maps this week's airings in the order the database returns them", async () => {
    const db = makeDb({
      rpc: {
        tv_home: {
          up_next: [],
          this_week: [
            { show: show(1, 'A', { poster_path: '/p.jpg' }), episode: ep(11, 1, '2026-01-01') },
            { show: show(2, 'B'), episode: ep(12, 2, '2026-01-03') },
          ],
          behind_minutes: 0,
          dormant_count: 0,
        },
      },
    });
    const { thisWeek } = await getHome(db);
    expect(thisWeek.map((u) => u.episode.tmdbId)).toEqual([11, 12]);
    expect(thisWeek[0].show.posterPath).toBe('/p.jpg');
    expect(thisWeek[1].episode.airDate).toBe('2026-01-03');
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
            dormant: true,
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
    expect(items.find((i) => i.show.name === 'Zeta')?.dormant).toBe(true);
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
          by_day: [{ date: '2026-07-06', count: 5 }],
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
    expect(s.byDay).toEqual([{ date: '2026-07-06', count: 5 }]);
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
        tv_follows: [{ show_tmdb_id: 1, archived: true, watchlist: false }],
        tv_lists: [{ id: 7, name: 'Anime' }],
        tv_list_shows: [{ list_id: 7, show_tmdb_id: 1 }],
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
    expect(detail!.watchlist).toBe(false);
    expect(detail!.allLists).toEqual([{ id: 7, name: 'Anime' }]);
    expect(detail!.listIds).toEqual([7]);
  });
});

describe('getLists', () => {
  it('returns lists with member counts', async () => {
    const db = makeDb({
      tables: {
        tv_lists: [
          { id: 7, name: 'Anime' },
          { id: 8, name: 'Comfort' },
        ],
        tv_list_shows: [{ list_id: 7 }, { list_id: 7 }, { list_id: 8 }],
      },
    });
    expect(await getLists(db)).toEqual([
      { id: 7, name: 'Anime', count: 2 },
      { id: 8, name: 'Comfort', count: 1 },
    ]);
  });
});

describe('getUpcoming', () => {
  it('returns upcoming episodes with their show from one embedded select', async () => {
    const selects: { table: string; cols: string }[] = [];
    const db = makeDb(
      {
        tables: {
          tv_follows: [{ show_tmdb_id: 1, archived: false, watchlist: false }],
          tv_episodes: [
            {
              tmdb_id: 11,
              show_tmdb_id: 1,
              season_number: 1,
              episode_number: 1,
              name: 'e1',
              air_date: '2026-01-01',
              still_path: null,
              show: show(1, 'A', { poster_path: '/p.jpg' }),
            },
          ],
        },
      },
      selects
    );
    const out = await getUpcoming(db, 7);
    expect(out).toHaveLength(1);
    expect(out[0].show.name).toBe('A');
    expect(out[0].show.posterPath).toBe('/p.jpg');
    expect(out[0].episode.airDate).toBe('2026-01-01');
    expect(selects.filter((s) => s.table === 'tv_shows')).toEqual([]);
  });
});

describe('column lists', () => {
  it('never selects every column, and leaves episode overviews out', async () => {
    const selects: { table: string; cols: string }[] = [];
    const db = makeDb(
      {
        rpc: {
          tv_library: [{ show_tmdb_id: 1, archived: false, aired_total: 1, aired_watched: 0 }],
        },
        tables: {
          tv_shows: [show(1, 'A')],
          tv_follows: [{ show_tmdb_id: 1, archived: false, watchlist: false }],
        },
      },
      selects
    );
    await Promise.all([getShowDetail(db, 1), getLibrary(db), getUpcoming(db)]);
    expect(selects.length).toBeGreaterThan(0);
    for (const s of selects) expect(s.cols).not.toContain('*');
    for (const s of selects.filter((s) => s.table === 'tv_episodes'))
      expect(s.cols).not.toMatch(/(^|,)overview/);
  });
});
