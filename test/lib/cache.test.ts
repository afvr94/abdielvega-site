import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the TMDB client the cache module depends on.
vi.mock('@/lib/tv/tmdb', () => ({
  getShow: vi.fn(),
  getSeason: vi.fn(),
  getExternalIds: vi.fn(),
}));

import { cacheShow } from '@/lib/tv/cache';
import { getShow, getSeason, getExternalIds } from '@/lib/tv/tmdb';

// Fake db that records upserts per table.
function makeRecordingDb() {
  const calls: Record<string, { rows: unknown; opts?: unknown }[]> = {};
  const db = {
    from: (table: string) => ({
      upsert: (rows: unknown, opts?: unknown) => {
        (calls[table] ??= []).push({ rows, opts });
        return Promise.resolve({ error: null });
      },
    }),
  } as unknown as SupabaseClient;
  return { db, calls };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('cacheShow', () => {
  it('upserts the show (with tvdb id) and all seasons’ episodes, nulling empty dates', async () => {
    vi.mocked(getShow).mockResolvedValue({
      id: 42,
      name: 'Test Show',
      poster_path: '/p.jpg',
      backdrop_path: '/b.jpg',
      overview: 'o',
      status: 'Returning Series',
      first_air_date: '', // empty → should become null
      number_of_episodes: 3,
      seasons: [
        { season_number: 1, episode_count: 2 },
        { season_number: 2, episode_count: 1 },
      ],
    });
    vi.mocked(getExternalIds).mockResolvedValue({ imdb_id: 'tt1', tvdb_id: 555 });
    vi.mocked(getSeason).mockImplementation(async (_id: number, sn: number) => ({
      season_number: sn,
      episodes:
        sn === 1
          ? [
              {
                id: 1001,
                season_number: 1,
                episode_number: 1,
                name: 'e1',
                overview: null,
                air_date: '2026-01-01',
                still_path: null,
                runtime: 22,
              },
              {
                id: 1002,
                season_number: 1,
                episode_number: 2,
                name: 'e2',
                overview: null,
                air_date: '',
                still_path: null,
                runtime: null,
              },
            ]
          : [
              {
                id: 2001,
                season_number: 2,
                episode_number: 1,
                name: 's2e1',
                overview: null,
                air_date: '2026-06-01',
                still_path: null,
                runtime: 30,
              },
            ],
    }));

    const { db, calls } = makeRecordingDb();
    await cacheShow(db, 42);

    // Show upsert
    expect(calls.tv_shows).toHaveLength(1);
    const showRow = calls.tv_shows[0].rows as Record<string, unknown>;
    expect(showRow.tmdb_id).toBe(42);
    expect(showRow.tvdb_id).toBe(555);
    expect(showRow.first_air_date).toBeNull(); // '' → null
    expect(showRow.last_synced_at).toBeTypeOf('string');

    // Episode upsert — all 3 episodes across both seasons
    const epRows = calls.tv_episodes.flatMap((c) => c.rows as Record<string, unknown>[]);
    expect(epRows).toHaveLength(3);
    expect(epRows.map((r) => r.tmdb_id).sort()).toEqual([1001, 1002, 2001]);
    const e2 = epRows.find((r) => r.tmdb_id === 1002)!;
    expect(e2.air_date).toBeNull(); // '' → null
    expect(calls.tv_episodes[0].opts).toMatchObject({ onConflict: 'tmdb_id' });
  });

  it('still caches the show when external ids fail', async () => {
    vi.mocked(getShow).mockResolvedValue({
      id: 7,
      name: 'No Ext',
      poster_path: null,
      backdrop_path: null,
      overview: null,
      status: 'Ended',
      first_air_date: '2020-01-01',
      number_of_episodes: 0,
      seasons: [],
    });
    vi.mocked(getExternalIds).mockRejectedValue(new Error('boom'));

    const { db, calls } = makeRecordingDb();
    await cacheShow(db, 7);

    const showRow = calls.tv_shows[0].rows as Record<string, unknown>;
    expect(showRow.tvdb_id).toBeNull();
    expect(showRow.first_air_date).toBe('2020-01-01');
    expect(calls.tv_episodes).toBeUndefined(); // no seasons → no episode upserts
  });
});
