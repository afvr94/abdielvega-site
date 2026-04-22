'use client';

import { useMemo } from 'react';
import { Copy } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TYPE_META, TYPE_ORDER } from '@/lib/budget/theme';
import type { Category, Plan } from '@/lib/budget/types';
import { fetchPlan } from '@/lib/budget/queries';
import { fmtUSD, formatMonthLong, shiftMonth } from '@/lib/budget/utils';

type Props = {
  currentMonth: string;
  categories: Category[];
  plan: Plan;
  onUpdate: (categoryId: string, amount: number) => void;
  onReplace: (plan: Plan) => void;
  supabaseClient: SupabaseClient;
};

export function PlanView({
  currentMonth,
  categories,
  plan,
  onUpdate,
  onReplace,
  supabaseClient,
}: Props) {
  async function copyFromPrevMonth() {
    const prev = await fetchPlan(supabaseClient, shiftMonth(currentMonth, -1));
    if (prev) onReplace(prev);
  }

  function resetToDefaults() {
    const next: Plan = {};
    for (const c of categories) next[c.id] = c.defaultAmount || 0;
    onReplace(next);
  }

  const draftTotals = useMemo(() => {
    const t = { income: 0, expense: 0, savings: 0 };
    for (const c of categories) {
      t[c.type] += plan[c.id] ?? c.defaultAmount ?? 0;
    }
    return { ...t, toAllocate: t.income - t.expense - t.savings };
  }, [categories, plan]);

  return (
    <div>
      <section className="mb-5">
        <div className="label-tag mb-1">Planning</div>
        <h2 className="font-display text-3xl font-semibold">
          Set {formatMonthLong(currentMonth)}&rsquo;s plan
        </h2>
        <p className="mt-1 text-sm text-muted">
          Allocate every income dollar. The goal is Income − Expenses − Savings = 0.
        </p>
      </section>

      <div className="card mb-5 p-4">
        <div className="mb-3 grid grid-cols-3 gap-3">
          {TYPE_ORDER.map((k) => (
            <div key={k}>
              <div className="label-tag" style={{ color: TYPE_META[k].color }}>
                {TYPE_META[k].label}
              </div>
              <div className="font-display text-xl font-semibold">{fmtUSD(draftTotals[k])}</div>
            </div>
          ))}
        </div>
        <div className="hairline flex items-center justify-between border-t pt-3">
          <span className="label-tag">Unallocated</span>
          <span
            className="font-display text-xl font-semibold"
            style={{
              color:
                draftTotals.toAllocate === 0
                  ? '#4A6741'
                  : draftTotals.toAllocate > 0
                    ? '#C17A1F'
                    : '#B54228',
            }}
          >
            {draftTotals.toAllocate >= 0 ? '+' : '−'}
            {fmtUSD(Math.abs(draftTotals.toAllocate))}
          </span>
        </div>
      </div>

      <div className="mb-5 flex gap-2">
        <button
          onClick={copyFromPrevMonth}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink/10 py-2.5 text-xs font-semibold uppercase tracking-wider"
        >
          <Copy size={13} /> Copy previous
        </button>
        <button
          onClick={resetToDefaults}
          className="flex-1 rounded-full bg-ink/10 py-2.5 text-xs font-semibold uppercase tracking-wider"
        >
          Reset to defaults
        </button>
      </div>

      {TYPE_ORDER.map((typeKey) => {
        const cats = categories.filter((c) => c.type === typeKey);
        if (!cats.length) return null;
        const info = TYPE_META[typeKey];
        return (
          <section key={typeKey} className="mb-5">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h3 className="font-display text-lg font-semibold" style={{ color: info.color }}>
                {info.label}
              </h3>
              <span className="font-mono-tab text-xs font-semibold" style={{ color: info.color }}>
                {fmtUSD(draftTotals[typeKey])}
              </span>
            </div>
            <div className="card overflow-hidden">
              {cats.map((c, i) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-2 px-3 py-2.5 ${
                    i < cats.length - 1 ? 'hairline border-b' : ''
                  }`}
                >
                  <span className="flex-1 text-sm font-medium">{c.name}</span>
                  <span className="font-display text-base text-muted">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={plan[c.id] ?? c.defaultAmount ?? ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => onUpdate(c.id, parseFloat(e.target.value) || 0)}
                    className="focus-ring font-mono-tab w-24 rounded bg-ink/[0.03] px-2 py-1.5 text-right text-sm"
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
