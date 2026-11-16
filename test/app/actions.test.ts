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
import { markWatched, markUnwatched, setArchived } from '@/app/tv/actions';

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
