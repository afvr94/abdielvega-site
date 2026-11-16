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
    for (const i of list.slice(0, MAX_LINES)) {
      out.push(`${escapeMarkdown(i.showName)} \`${episodeCode(i.seasonNumber, i.episodeNumber)}\``);
    }
    if (list.length > MAX_LINES) out.push(`+${list.length - MAX_LINES} more`);
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
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  });
  if (!res.ok) throw new Error(`discord ${res.status}: ${await res.text()}`);
}

function escapeMarkdown(s: string) {
  return s.replace(/([\\*_~`|>[\]])/g, '\\$1');
}
