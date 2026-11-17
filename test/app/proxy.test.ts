import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

const getClaims = vi.fn();
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getClaims } }),
}));

import { proxy } from '@/proxy';

const visit = (path: string) =>
  proxy(
    new NextRequest(`https://tv.abdielvega.com${path}`, { headers: { host: 'tv.abdielvega.com' } })
  );

describe('proxy auth gate', () => {
  it('sends a visitor without a verified session to /login', async () => {
    getClaims.mockResolvedValue({ data: null, error: new Error('no session') });
    expect((await visit('/shows')).headers.get('location')).toBe('https://tv.abdielvega.com/login');
  });

  it('rewrites a request with a verified session into the tracker', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'u1' } }, error: null });
    const res = await visit('/shows');
    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('x-middleware-rewrite')).toBe('https://tv.abdielvega.com/tv/shows');
  });
});
