import { describe, it, expect, vi } from 'vitest';

let host = '';
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ host }),
}));

import { generateMetadata } from '@/app/login/page';

describe('login metadata', () => {
  it('uses the cliffo title and icon on the tv host', async () => {
    host = 'tv.abdielvega.com';
    const meta = await generateMetadata();
    expect(meta.title).toEqual({ absolute: 'Sign in · cliffo' });
    expect(meta.icons).toEqual({ icon: '/cliffo/icon-192.png', apple: '/cliffo/icon-192.png' });
  });

  it('keeps the site icon on the budget host', async () => {
    host = 'budget.abdielvega.com';
    const meta = await generateMetadata();
    expect(meta.title).toBe('Sign in');
    expect(meta.icons).toBeUndefined();
  });
});
