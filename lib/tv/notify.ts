import { episodeCode, humanizeMinutes } from './format';

export type NotifyItem = {
  showName: string;
  seasonNumber: number;
  episodeNumber: number;
  airDate: string | null;
};

export type Behind = { episodes: number; minutes: number };

const APP_URL = 'https://tv.abdielvega.com';
// Discord rejects messages over 2,000 characters; a long backlog gets a "+N more".
const MAX_LINES = 25;

// Spoiler-safe: show name and episode code only, never the episode title.
export function buildDiscordMessage(items: NotifyItem[], today: string, behind?: Behind): string {
  const tonight = items.filter((i) => i.airDate === today);
  const earlier = items.filter((i) => i.airDate !== today);

  const out: string[] = [];
  const section = (title: string, list: NotifyItem[]) => {
    if (list.length === 0) return;
    out.push(`**${title}**`);
    const lines = byShow(list);
    for (const line of lines.slice(0, MAX_LINES)) out.push(line);
    if (lines.length > MAX_LINES) out.push(`+${lines.length - MAX_LINES} more shows`);
  };
  section('📺 Tonight', tonight);
  section('New since last time', earlier);

  if (behind && behind.episodes > 0) {
    out.push(
      `-# Behind: ${behind.episodes.toLocaleString('en-US')} eps · ${humanizeMinutes(behind.minutes)} · [Open cliffo](${APP_URL})`
    );
  } else {
    out.push(`-# [Open cliffo](${APP_URL})`);
  }
  return out.join('\n');
}

export async function sendDiscord(webhookUrl: string, content: string): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // A show named "@everyone" must not ping anyone.
    // flags 4 = SUPPRESS_EMBEDS: no link preview card under the post.
    body: JSON.stringify({ content, allowed_mentions: { parse: [] }, flags: 4 }),
  });
  if (!res.ok) throw new Error(`discord ${res.status}: ${await res.text()}`);
}

// One line per show, with consecutive episodes collapsed: "Show `S01E03–E08`".
function byShow(list: NotifyItem[]): string[] {
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
