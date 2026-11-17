import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({}) }));
vi.mock('@/lib/tv/queries', () => ({ getUpcoming: vi.fn().mockResolvedValue([]) }));

import { GET } from '@/app/api/tv/calendar/route';

const TOKEN = 'a'.repeat(40);
const req = (q: string) => new NextRequest(`https://tv.abdielvega.com/api/tv/calendar${q}`);

beforeEach(() => vi.stubEnv('TV_CALENDAR_TOKEN', TOKEN));

describe('calendar feed route', () => {
  it('serves the feed for the right token', async () => {
    const res = await GET(req(`?token=${TOKEN}`));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/calendar/);
    expect(await res.text()).toContain('BEGIN:VCALENDAR');
  });

  it.each([
    ['no token', ''],
    ['a wrong token', `?token=${'b'.repeat(40)}`],
    ['a short token', '?token=a'],
  ])('hides itself with %s', async (_, q) => {
    expect((await GET(req(q))).status).toBe(404);
  });

  it('stays closed when the token env var is unset', async () => {
    vi.stubEnv('TV_CALENDAR_TOKEN', '');
    expect((await GET(req('?token='))).status).toBe(404);
  });
});
