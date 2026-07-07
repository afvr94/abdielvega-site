import { describe, it, expect } from 'vitest';
import { imageUrl } from '@/lib/tv/tmdb';

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
