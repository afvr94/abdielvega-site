export function episodeCode(season: number, episode: number): string {
  return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Parse the YYYY-MM-DD string directly to avoid timezone drift.
export function formatAirDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

// "Mon · Jul 8" for a calendar day heading.
export function dayHeading(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '';
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday} · ${MONTHS[m - 1]} ${d}`;
}

// Minutes → "1,234 hrs" (rounded).
export function humanizeMinutes(min: number): string {
  const hrs = Math.round(min / 60);
  return `${hrs.toLocaleString('en-US')} hr${hrs === 1 ? '' : 's'}`;
}

// Minutes → "51 days" (rounded whole days).
export function daysFromMinutes(min: number): string {
  const days = Math.round(min / 1440);
  return `${days.toLocaleString('en-US')} day${days === 1 ? '' : 's'}`;
}
