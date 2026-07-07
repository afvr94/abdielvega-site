// GitHub-style contribution grid for the Stats page — pure date math so it's
// timezone-stable and unit-testable.

export type HeatCell = { date: string; count: number } | null;

function toEpochDay(iso: string): number {
  const [y = 1970, m = 1, d = 1] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}
function fromEpochDay(n: number): string {
  return new Date(n * 86_400_000).toISOString().slice(0, 10);
}
function weekday(iso: string): number {
  const [y = 1970, m = 1, d = 1] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
}

// Bucket a day's watch count into a 0–4 intensity level.
export function heatLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

// Columns of 7 days (Sun→Sat) covering the `weeks` ending at `endDate`.
// Days after `endDate` (the tail of the final week) are null.
export function buildHeatmap(
  byDay: { date: string; count: number }[],
  endDate: string,
  weeks = 53
): { columns: HeatCell[][]; months: { label: string; col: number }[] } {
  const counts = new Map(byDay.map((d) => [d.date, d.count]));
  const endEpoch = toEpochDay(endDate);
  const gridEnd = endEpoch + (6 - weekday(endDate)); // Saturday of the end week
  const gridStart = gridEnd - weeks * 7 + 1; // a Sunday

  const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const columns: HeatCell[][] = [];
  const months: { label: string; col: number }[] = [];
  let lastMonth = -1;

  for (let w = 0; w < weeks; w++) {
    const col: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const epoch = gridStart + w * 7 + d;
      if (epoch > endEpoch) {
        col.push(null);
        continue;
      }
      const iso = fromEpochDay(epoch);
      col.push({ date: iso, count: counts.get(iso) ?? 0 });
    }
    // Label a column when its first day starts a new month.
    const first = col[0];
    if (first) {
      const month = Number(first.date.slice(5, 7)) - 1;
      if (month !== lastMonth) {
        months.push({ label: MONTHS[month] ?? '', col: w });
        lastMonth = month;
      }
    }
    columns.push(col);
  }
  return { columns, months };
}
