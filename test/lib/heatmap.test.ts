import { describe, it, expect } from 'vitest';
import { buildHeatmap, heatLevel } from '@/lib/tv/heatmap';

describe('heatLevel', () => {
  it('buckets counts into 0–4', () => {
    expect(heatLevel(0)).toBe(0);
    expect(heatLevel(1)).toBe(1);
    expect(heatLevel(2)).toBe(1);
    expect(heatLevel(5)).toBe(2);
    expect(heatLevel(9)).toBe(3);
    expect(heatLevel(50)).toBe(4);
  });
});

describe('buildHeatmap', () => {
  it('produces `weeks` columns of 7 days, Sunday-aligned', () => {
    const { columns } = buildHeatmap([], '2026-07-07', 4);
    expect(columns).toHaveLength(4);
    for (const col of columns) expect(col).toHaveLength(7);
    // First cell of the grid is a Sunday
    const first = columns[0][0]!;
    expect(new Date(first.date + 'T00:00:00Z').getUTCDay()).toBe(0);
  });

  it('maps counts onto the right day and nulls out days after endDate', () => {
    // 2026-07-07 is a Tuesday → Wed–Sat of its week are in the future
    const { columns } = buildHeatmap([{ date: '2026-07-06', count: 4 }], '2026-07-07', 2);
    const flat = columns.flat();
    const marked = flat.find((c) => c && c.date === '2026-07-06');
    expect(marked?.count).toBe(4);
    const future = flat.find((c) => c && c.date === '2026-07-08');
    expect(future).toBeUndefined(); // beyond endDate → null, not a cell
    expect(flat.some((c) => c === null)).toBe(true);
  });

  it('emits a month label when the month rolls over', () => {
    const { months } = buildHeatmap([], '2026-07-07', 12);
    expect(months.length).toBeGreaterThan(0);
    expect(
      months.every((m) => /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/.test(m.label))
    ).toBe(true);
  });
});
