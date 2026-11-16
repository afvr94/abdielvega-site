import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const exchangeCodeForSession = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { exchangeCodeForSession } }),
}));

import { GET } from '@/app/auth/callback/route';

const call = async (query: string) =>
  (await GET(new NextRequest(`https://tv.abdielvega.com/auth/callback?${query}`))).headers.get(
    'location'
  );

beforeEach(() => exchangeCodeForSession.mockResolvedValue({ error: null }));

describe('auth callback', () => {
  it('signs in and goes to the requested same-site path', async () => {
    expect(await call('code=abc&next=/calendar')).toBe('https://tv.abdielvega.com/calendar');
    expect(exchangeCodeForSession).toHaveBeenCalledWith('abc');
  });

  it.each([
    '//evil.example',
    '/\\evil.example',
    '/\t/evil.example',
    'https://evil.example',
    'http://',
  ])('ignores an off-site next (%s)', async (next) => {
    expect(await call(`code=abc&next=${encodeURIComponent(next)}`)).toBe(
      'https://tv.abdielvega.com/'
    );
  });

  it('reports a refused sign-in', async () => {
    expect(await call('error=access_denied&error_description=Signups+not+allowed')).toBe(
      'https://tv.abdielvega.com/login?error=denied'
    );
  });

  it('reports a failed code exchange', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error('bad code') });
    expect(await call('code=abc')).toBe('https://tv.abdielvega.com/login?error=failed');
  });
});
