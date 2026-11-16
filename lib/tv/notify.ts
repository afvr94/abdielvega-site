import { episodeCode, humanizeMinutes } from './format';

export type NotifyItem = {
  showName: string;
  seasonNumber: number;
  episodeNumber: number;
  airDate: string | null;
};

export type Behind = { episodes: number; minutes: number };

const APP_URL = 'https://tv.abdielvega.com';
const MAX_LINES = 25;
const DISCORD_MAX_CHARS = 2000;
const SUPPRESS_EMBEDS = 1 << 2;
const HEADERS_AND_MORE_LINES_RESERVE = 80;

export function buildDiscordMessage(items: NotifyItem[], today: string, behind?: Behind): string {
  const tonight = items.filter((i) => i.airDate === today);
  const earlier = items.filter((i) => i.airDate !== today);
  const footer =
    behind && behind.episodes > 0
      ? `-# Behind: ${behind.episodes.toLocaleString('en-US')} eps · ${humanizeMinutes(behind.minutes)} · [Open cliffo](${APP_URL})`
      : `-# [Open cliffo](${APP_URL})`;

  const out: string[] = [];
  let size = footer.length + HEADERS_AND_MORE_LINES_RESERVE;
  const push = (line: string) => {
    out.push(line);
    size += line.length + 1;
  };
  const section = (title: string, list: NotifyItem[]) => {
    if (list.length === 0) return;
    push(`**${title}**`);
    const lines = collapsedLinePerShow(list);
    let shown = 0;
    for (const line of lines.slice(0, MAX_LINES)) {
      if (size + line.length >= DISCORD_MAX_CHARS) break;
      push(line);
      shown += 1;
    }
    if (shown < lines.length) push(`+${lines.length - shown} more shows`);
  };
  section('📺 Tonight', tonight);
  section('New since last time', earlier);

  out.push(footer);
  return out.join('\n');
}

export async function sendDiscord(webhookUrl: string, content: string): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, allowed_mentions: { parse: [] }, flags: SUPPRESS_EMBEDS }),
  });
  if (!res.ok) throw new Error(`discord ${res.status}: ${await res.text()}`);
}

function collapsedLinePerShow(list: NotifyItem[]): string[] {
  const shows = new Map<string, NotifyItem[]>();
  for (const i of list) shows.set(i.showName, [...(shows.get(i.showName) ?? []), i]);

  return [...shows].map(([name, eps]) => {
    eps.sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber);
    const runs: { season: number; from: number; to: number }[] = [];
    for (const e of eps) {
      const run = runs[runs.length - 1];
      if (run && run.season === e.seasonNumber && run.to + 1 === e.episodeNumber) run.to += 1;
      else runs.push({ season: e.seasonNumber, from: e.episodeNumber, to: e.episodeNumber });
    }
    const codes = runs.map(({ season, from, to }) => {
      const first = episodeCode(season, from);
      return from === to ? `\`${first}\`` : `\`${first}–E${String(to).padStart(2, '0')}\``;
    });
    return `${escapeMarkdown(name)} ${codes.join(' ')}`;
  });
}

function escapeMarkdown(s: string) {
  return s.replace(/([\\*_~`|>[\]])/g, '\\$1');
}
