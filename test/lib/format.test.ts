import { describe, it, expect } from 'vitest';
import {
  addDaysIso,
  dateIso,
  episodeCode,
  formatAirDate,
  dayHeading,
  humanizeMinutes,
  daysFromMinutes,
} from '@/lib/tv/format';

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

describe('humanizeMinutes', () => {
  it('rounds to whole hours and pluralizes', () => {
    expect(humanizeMinutes(0)).toBe('0 hrs');
    expect(humanizeMinutes(60)).toBe('1 hr');
    expect(humanizeMinutes(90)).toBe('2 hrs'); // 1.5 → 2
    expect(humanizeMinutes(6000)).toBe('100 hrs');
  });
  it('adds thousands separators', () => {
    expect(humanizeMinutes(600000)).toBe('10,000 hrs');
  });
});

describe('daysFromMinutes', () => {
  it('rounds to whole days and pluralizes', () => {
    expect(daysFromMinutes(0)).toBe('0 days');
    expect(daysFromMinutes(1440)).toBe('1 day');
    expect(daysFromMinutes(2880)).toBe('2 days');
  });
});

describe('dateIso', () => {
  it('uses Eastern time, so a late-evening UTC rollover is still today', () => {
    expect(dateIso(new Date('2026-11-17T03:00:00Z'))).toBe('2026-11-16'); // 10pm, winter
    expect(dateIso(new Date('2026-07-01T03:30:00Z'))).toBe('2026-06-30'); // 11:30pm, summer
    expect(dateIso(new Date('2026-11-16T05:30:00Z'))).toBe('2026-11-16');
  });
});

describe('addDaysIso', () => {
  it('adds calendar days to a YYYY-MM-DD date', () => {
    expect(addDaysIso('2026-11-16', 90)).toBe('2027-02-14');
    expect(addDaysIso('2026-03-07', 1)).toBe('2026-03-08');
  });
});
