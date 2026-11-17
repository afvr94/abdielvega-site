import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// Every query-builder call returns the builder, which resolves to { error: null }.
const builder: Record<string, unknown> = new Proxy(
  {},
  {
    get: (_, key) =>
      key === 'then'
        ? (res: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(res)
        : () => builder,
  }
);
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: () => builder }),
}));
vi.mock('@/lib/tv/cache', () => ({ cacheShow: vi.fn() }));

import { revalidatePath } from 'next/cache';
import { archiveShows, markWatched, markUnwatched, setArchived } from '@/app/tv/actions';

beforeEach(() => vi.clearAllMocks());

describe('episode watch actions', () => {
  it.each([
    ['markWatched', markWatched],
    ['markUnwatched', markUnwatched],
  ])('%s revalidates Up Next but not the show page', async (_, action) => {
    await action(7, 1, 2);
    expect(revalidatePath).toHaveBeenCalledWith('/tv');
    expect(revalidatePath).not.toHaveBeenCalledWith('/tv/show/7');
  });

  it('show-level actions still revalidate the show page', async () => {
    await setArchived(7, true);
    expect(revalidatePath).toHaveBeenCalledWith('/tv/show/7');
  });
});

describe('archiveShows', () => {
  it('rejects ids that are not positive integers', async () => {
    await expect(archiveShows([1, -2])).rejects.toThrow(/invalid show ids/i);
    await expect(archiveShows([1.5])).rejects.toThrow(/invalid show ids/i);
  });

  it('revalidates Up Next and the library', async () => {
    await archiveShows([1, 2]);
    expect(revalidatePath).toHaveBeenCalledWith('/tv');
    expect(revalidatePath).toHaveBeenCalledWith('/tv/shows');
  });
});
