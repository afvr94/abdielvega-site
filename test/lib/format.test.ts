import { describe, it, expect } from 'vitest';
import { episodeCode, formatAirDate, dayHeading } from '@/lib/tv/format';

describe('episodeCode', () => {
  it('zero-pads single digits', () => {
    expect(episodeCode(1, 1)).toBe('S01E01');
    expect(episodeCode(2, 5)).toBe('S02E05');
  });
  it('leaves multi-digit numbers intact', () => {
    expect(episodeCode(10, 123)).toBe('S10E123');
    expect(episodeCode(21, 182)).toBe('S21E182');
  });
  it('handles season 0 (specials)', () => {
    expect(episodeCode(0, 3)).toBe('S00E03');
  });
});

describe('formatAirDate', () => {
  it('formats an ISO date without timezone drift', () => {
    expect(formatAirDate('2026-07-08')).toBe('Jul 8, 2026');
    expect(formatAirDate('2026-01-31')).toBe('Jan 31, 2026');
    expect(formatAirDate('2026-12-01')).toBe('Dec 1, 2026');
  });
  it('returns empty string for missing or malformed input', () => {
    expect(formatAirDate(null)).toBe('');
    expect(formatAirDate(undefined)).toBe('');
    expect(formatAirDate('')).toBe('');
    expect(formatAirDate('not-a-date')).toBe('');
  });
});

describe('dayHeading', () => {
  it('renders weekday · month day', () => {
    // 2026-01-01 is a Thursday
    expect(dayHeading('2026-01-01')).toBe('Thu · Jan 1');
  });
  it('is timezone-stable (parses the string directly)', () => {
    expect(dayHeading('2026-07-08')).toMatch(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) · Jul 8$/);
  });
  it('returns empty string for malformed input', () => {
    expect(dayHeading('')).toBe('');
    expect(dayHeading('nope')).toBe('');
  });
});
