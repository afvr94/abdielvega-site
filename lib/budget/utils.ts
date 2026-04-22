export const fmtUSD = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));

export const fmtUSDc = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

export const fmtPct = (n: number) => `${Math.round(n || 0)}%`;

export function ymKey(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y!, m! - 1 + delta, 1);
  return ymKey(d);
}

export function formatMonthLong(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y!, m! - 1, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function daysInMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y!, m!, 0).getDate();
}

export function daysRemainingIn(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const now = new Date();
  const cur = y! * 12 + m!;
  const nw = now.getFullYear() * 12 + now.getMonth() + 1;
  if (nw > cur) return 0;
  if (nw < cur) return daysInMonth(ym);
  return daysInMonth(ym) - now.getDate() + 1;
}

export function monthElapsedFrac(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const now = new Date();
  const cur = y! * 12 + m!;
  const nw = now.getFullYear() * 12 + now.getMonth() + 1;
  if (nw > cur) return 1;
  if (nw < cur) return 0;
  return now.getDate() / daysInMonth(ym);
}

export function monthRangeUTC(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const start = new Date(Date.UTC(y!, m! - 1, 1)).toISOString();
  const end = new Date(Date.UTC(y!, m!, 1)).toISOString();
  return { start, end };
}

export const newId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
