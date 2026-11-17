import { describe, it, expect } from 'vitest';
import { buildCalendar } from '@/lib/tv/ical';
import { makeEpisode, makeShow } from '../factories';

const now = new Date('2026-11-17T05:06:07.890Z');

function item(name: string, airDate: string | null, tmdbId = 77) {
  return {
    show: makeShow({ tmdbId: 3, name }),
    episode: makeEpisode({ tmdbId, seasonNumber: 1, episodeNumber: 3, airDate, name: 'Secret' }),
  };
}

describe('buildCalendar', () => {
  it('writes an all-day, spoiler-free event per episode with CRLF lines', () => {
    const ics = buildCalendar([item('Severance', '2026-11-30')], now);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('UID:tv-episode-77@abdielvega.com\r\n');
    expect(ics).toContain('DTSTAMP:20261117T050607Z\r\n');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261130\r\n');
    expect(ics).toContain('DTEND;VALUE=DATE:20261201\r\n');
    expect(ics).toContain('SUMMARY:Severance S01E03\r\n');
    expect(ics).toContain('URL:https://tv.abdielvega.com/show/3\r\n');
    expect(ics).not.toContain('Secret');
  });

  it('escapes text and skips episodes without an air date', () => {
    const ics = buildCalendar(
      [item('Love; Death, Ro\\bots', '2026-12-01'), item('X', null, 9)],
      now
    );
    expect(ics).toContain('SUMMARY:Love\\; Death\\, Ro\\\\bots S01E03');
    expect(ics).not.toContain('tv-episode-9@');
  });

  it('folds lines longer than 75 octets without splitting a character', () => {
    const ics = buildCalendar([item('é'.repeat(60), '2026-12-01')], now);
    const lines = ics.split('\r\n');
    for (const line of lines) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    const summary = lines.findIndex((l) => l.startsWith('SUMMARY:'));
    expect(lines[summary + 1].startsWith(' ')).toBe(true);
    const unfolded = ics.replace(/\r\n /g, '');
    expect(unfolded).toContain(`SUMMARY:${'é'.repeat(60)} S01E03`);
  });
});
