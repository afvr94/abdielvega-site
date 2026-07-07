import { describe, it, expect } from 'vitest';
import { watchKey } from '@/lib/tv/types';

describe('watchKey', () => {
  it('joins season and episode with a dash', () => {
    expect(watchKey(2, 5)).toBe('2-5');
    expect(watchKey(0, 1)).toBe('0-1');
    expect(watchKey(21, 182)).toBe('21-182');
  });
  it('is stable for use as a Set key', () => {
    const set = new Set([watchKey(1, 1), watchKey(1, 1)]);
    expect(set.size).toBe(1);
    expect(set.has(watchKey(1, 1))).toBe(true);
  });
});
