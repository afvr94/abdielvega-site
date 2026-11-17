import { describe, it, expect } from 'vitest';
import {
  imageUrl,
  pickStreamingProviders,
  streamingProviders,
  type TmdbWatchProviders,
} from '@/lib/tv/tmdb';

describe('imageUrl', () => {
  it('builds a TMDB image URL with the default size', () => {
    expect(imageUrl('/poster.jpg')).toBe('https://image.tmdb.org/t/p/w342/poster.jpg');
  });
  it('honors an explicit size', () => {
    expect(imageUrl('/still.jpg', 'w780')).toBe('https://image.tmdb.org/t/p/w780/still.jpg');
  });
  it('returns null for empty / missing paths', () => {
    expect(imageUrl(null)).toBeNull();
    expect(imageUrl(undefined)).toBeNull();
    expect(imageUrl('')).toBeNull();
  });
});

describe('pickStreamingProviders', () => {
  const data: TmdbWatchProviders = {
    results: {
      US: {
        link: 'https://justwatch.com/x',
        flatrate: [
          { provider_id: 8, provider_name: 'Netflix', logo_path: '/nf.jpg', display_priority: 2 },
          {
            provider_id: 283,
            provider_name: 'Crunchyroll',
            logo_path: '/cr.jpg',
            display_priority: 1,
          },
        ],
        ads: [
          // duplicate of Crunchyroll — should be deduped
          {
            provider_id: 283,
            provider_name: 'Crunchyroll',
            logo_path: '/cr.jpg',
            display_priority: 1,
          },
        ],
      },
    },
  };

  it('returns streaming providers ordered by display priority, deduped, with logo URLs', () => {
    const { providers, link } = pickStreamingProviders(data, 'US');
    expect(providers.map((p) => p.name)).toEqual(['Crunchyroll', 'Netflix']);
    expect(providers[0].logoUrl).toBe('https://image.tmdb.org/t/p/w92/cr.jpg');
    expect(link).toBe('https://justwatch.com/x');
  });

  it('returns empty for a region with no data', () => {
    expect(pickStreamingProviders(data, 'JP')).toEqual({ providers: [], link: null });
  });
});

describe('streamingProviders', () => {
  it('keeps provider ids, deduped across tiers, in display order', () => {
    const p = (id: number, name: string, prio: number) => ({
      provider_id: id,
      provider_name: name,
      logo_path: `/${id}.jpg`,
      display_priority: prio,
    });
    const data = {
      results: { US: { flatrate: [p(2, 'Hulu', 5), p(8, 'Netflix', 1)], ads: [p(2, 'Hulu', 5)] } },
    };
    expect(streamingProviders(data, 'US')).toEqual([
      { id: 8, name: 'Netflix', logoPath: '/8.jpg' },
      { id: 2, name: 'Hulu', logoPath: '/2.jpg' },
    ]);
  });
});
