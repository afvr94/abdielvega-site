'use client';

import { TYPE_META, TYPE_ORDER } from '@/lib/budget/theme';
import type { Category, Plan, Totals } from '@/lib/budget/types';
import { daysRemainingIn, fmtPct, fmtUSD, fmtUSDc, monthElapsedFrac } from '@/lib/budget/utils';

type Props = {
  currentMonth: string;
  categories: Category[];
  plan: Plan;
  tracked: Record<string, number>;
  totals: Totals;
};

export function Dashboard({ currentMonth, categories, plan, tracked, totals }: Props) {
  const daysLeft = daysRemainingIn(currentMonth);
  const elapsed = monthElapsedFrac(currentMonth);

  return (
    <div>
      {/* Net headline */}
      <section className="mb-6">
        <div className="mb-1 flex items-baseline justify-between">
          <div className="label-tag">Net this month</div>
          <div className="label-tag">{daysLeft} days left</div>
        </div>
        <div className="font-display text-5xl font-medium leading-none tracking-tightest-3 sm:text-6xl">
          {totals.netTracked >= 0 ? '+' : '−'}
          {fmtUSD(Math.abs(totals.netTracked))}
        </div>
        <div className="mt-1 text-sm text-muted">
          Income − Expenses − Savings = what’s left unassigned
        </div>
      </section>

      {/* Type cards */}
      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TYPE_ORDER.map((typeKey) => {
          const t = totals[typeKey];
          const info = TYPE_META[typeKey];
          const pct = t.planned > 0 ? (t.tracked / t.planned) * 100 : 0;
          const isIncome = typeKey === 'income';
          const barColor = isIncome
            ? pct >= elapsed * 100 * 0.9
              ? info.color
              : '#C17A1F'
            : pct > 100
              ? '#B54228'
              : pct > elapsed * 100 + 15
                ? '#C17A1F'
                : info.color;

          const Icon = info.icon;
          return (
            <div key={typeKey} className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={14} style={{ color: info.color }} />
                  <span className="label-tag" style={{ color: info.color }}>
                    {info.label}
                  </span>
                </div>
                <span className="font-mono-tab text-[11px] text-muted">{fmtPct(pct)}</span>
              </div>
              <div className="font-display text-2xl font-semibold">{fmtUSD(t.tracked)}</div>
              <div className="font-mono-tab mt-0.5 text-xs text-muted">
                of {fmtUSD(t.planned)} planned
              </div>
              <div
                className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: '#1A181510' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* Zero-based allocation check */}
      <section className="card mb-6 flex items-center justify-between p-4">
        <div>
          <div className="label-tag mb-1">Zero-based planning</div>
          <div className="text-sm">
            {totals.toAllocate === 0
              ? 'Every planned dollar is assigned. ✓'
              : totals.toAllocate > 0
                ? `${fmtUSD(totals.toAllocate)} of planned income is unassigned`
                : `Plan is over by ${fmtUSD(Math.abs(totals.toAllocate))}`}
          </div>
        </div>
        <div
          className="font-display text-2xl font-semibold"
          style={{
            color:
              totals.toAllocate === 0 ? '#4A6741' : totals.toAllocate > 0 ? '#C17A1F' : '#B54228',
          }}
        >
          {totals.toAllocate >= 0 ? '+' : '−'}
          {fmtUSD(Math.abs(totals.toAllocate))}
        </div>
      </section>

      {/* Per-category breakdown */}
      {TYPE_ORDER.map((typeKey) => {
        const cats = categories.filter((c) => c.type === typeKey);
        if (!cats.length) return null;
        const info = TYPE_META[typeKey];
        return (
          <section key={typeKey} className="mb-6">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-semibold" style={{ color: info.color }}>
                {info.label}
              </h2>
              <span className="label-tag">{cats.length} categories</span>
            </div>
            <div className="card overflow-hidden">
              {cats.map((c, i) => {
                const planned = plan[c.id] ?? c.defaultAmount ?? 0;
                const actual = tracked[c.id] ?? 0;
                const pct = planned > 0 ? (actual / planned) * 100 : 0;
                const isIncome = typeKey === 'income';
                const remaining = planned - actual;
                const excess = Math.max(0, actual - planned);
                const barColor = isIncome
                  ? pct >= 100
                    ? info.color
                    : pct >= 70
                      ? '#C17A1F'
                      : '#8A8178'
                  : pct > 100
                    ? '#B54228'
                    : pct > 80
                      ? '#C17A1F'
                      : info.color;

                return (
                  <div
                    key={c.id}
                    className={`px-4 py-3 ${i < cats.length - 1 ? 'hairline border-b' : ''}`}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono-tab text-[10px] text-muted">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[15px] font-medium">{c.name}</span>
                      </div>
                      <div className="font-mono-tab text-right">
                        <span
                          className="text-[15px] font-semibold"
                          style={{ color: excess > 0 ? '#B54228' : '#1A1815' }}
                        >
                          {fmtUSDc(actual)}
                        </span>
                        <span className="ml-1 text-xs text-muted">/ {fmtUSD(planned)}</span>
                      </div>
                    </div>
                    <div
                      className="mb-1.5 h-1 w-full overflow-hidden rounded-full"
                      style={{ backgroundColor: '#1A18150E' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                    <div className="font-mono-tab flex items-center justify-between text-[11px] text-muted">
                      <span>{fmtPct(pct)} complete</span>
                      <span>
                        {excess > 0 ? (
                          <span style={{ color: '#B54228' }}>over by {fmtUSDc(excess)}</span>
                        ) : (
                          <span>{fmtUSDc(Math.max(0, remaining))} remaining</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
