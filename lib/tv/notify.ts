import { episodeCode, formatAirDate } from './format';

export type NotifyItem = {
  showName: string;
  seasonNumber: number;
  episodeNumber: number;
  name: string | null;
  airDate: string | null;
};

const APP_URL = 'https://tv.abdielvega.com';

// Builds the "new episodes" digest email. Pure — takes the episodes, returns
// the subject/text/html so it can be unit-tested without SMTP.
export function buildNotificationEmail(items: NotifyItem[]): {
  subject: string;
  text: string;
  html: string;
} {
  const first = items[0];
  const subject =
    items.length === 1 && first
      ? `New episode — ${first.showName}`
      : `${items.length} new episodes to watch`;

  const line = (i: NotifyItem) =>
    `${i.showName} · ${episodeCode(i.seasonNumber, i.episodeNumber)}${i.name ? ` — ${i.name}` : ''}`;

  const text = [
    'New episodes from shows you follow:',
    '',
    ...items.map((i) => `• ${line(i)}${i.airDate ? `  (${formatAirDate(i.airDate)})` : ''}`),
    '',
    `Open The Marquee: ${APP_URL}`,
  ].join('\n');

  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e0d5;">
          <div style="font-weight:600;">${escapeHtml(i.showName)}</div>
          <div style="color:#8a8178;font-size:13px;">
            ${episodeCode(i.seasonNumber, i.episodeNumber)}${i.name ? ` · ${escapeHtml(i.name)}` : ''}
            ${i.airDate ? ` · ${formatAirDate(i.airDate)}` : ''}
          </div>
        </td>
      </tr>`
    )
    .join('');

  const html = `
  <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1a1815;">
    <h2 style="font-weight:600;">New episodes to watch</h2>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
    <p style="margin-top:20px;">
      <a href="${APP_URL}" style="color:#2e5266;">Open The Marquee →</a>
    </p>
  </div>`;

  return { subject, text, html };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
