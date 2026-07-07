import { describe, it, expect } from 'vitest';
import { imageUrl, pickStreamingProviders, type TmdbWatchProviders } from '@/lib/tv/tmdb';

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
