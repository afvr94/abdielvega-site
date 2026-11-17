import type { UpcomingEpisode } from './types';
import { APP_URL, addDaysIso, episodeCode } from './format';

const icsDate = (iso: string) => iso.replaceAll('-', '');

const escapeText = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');

const encoder = new TextEncoder();

// RFC 5545 caps a line at 75 octets; each continuation starts with a space.
function fold(line: string): string {
  const out: string[] = [];
  let current = '';
  let bytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      out.push(current);
      current = '';
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join('\r\n ');
}

// All-day events titled "Show S01E03" only, so the calendar never spoils an episode title.
export function buildCalendar(items: UpcomingEpisode[], now: Date): string {
  const stamp = now.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//abdielvega.com//cliffo//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:cliffo',
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H',
  ];
  for (const { show, episode } of items) {
    if (!episode.airDate) continue;
    lines.push(
      'BEGIN:VEVENT',
      `UID:tv-episode-${episode.tmdbId}@abdielvega.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(episode.airDate)}`,
      `DTEND;VALUE=DATE:${icsDate(addDaysIso(episode.airDate, 1))}`,
      `SUMMARY:${escapeText(`${show.name} ${episodeCode(episode.seasonNumber, episode.episodeNumber)}`)}`,
      `URL:${APP_URL}/show/${show.tmdbId}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
