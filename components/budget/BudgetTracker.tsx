'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Receipt,
  Target,
  Settings as Cog,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Category, Plan, Totals, Transaction } from '@/lib/budget/types';
import {
  deleteCategory,
  deleteTransaction,
  fetchCategories,
  fetchPlanWithFallback,
  fetchTransactionsForMonth,
  insertTransaction,
  upsertCategory,
  writePlan,
} from '@/lib/budget/queries';
import { formatMonthLong, shiftMonth, ymKey } from '@/lib/budget/utils';
import { Dashboard } from './Dashboard';
import { LogView } from './LogView';
import { PlanView } from './PlanView';
import { SetupView } from './SetupView';

type Tab = 'dashboard' | 'log' | 'plan' | 'setup';

const TABS: Array<{ id: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
  { id: 'log', label: 'Log', icon: Receipt },
  { id: 'plan', label: 'Plan', icon: Target },
  { id: 'setup', label: 'Setup', icon: Cog },
];

export function BudgetTracker() {
  const supabase = useMemo(() => createClient(), []);

  const [tab, setTab] = useState<Tab>('dashboard');
  const [currentMonth, setCurrentMonth] = useState<string>(ymKey());
  const [categories, setCategories] = useState<Category[]>([]);
  const [plan, setPlan] = useState<Plan>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingMonth, setLoadingMonth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Load categories once ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchCategories(supabase);
        if (!cancelled) setCategories(rows);
      } catch (err) {
        if (!cancelled) setSaveError(err instanceof Error ? err.message : 'Load failed');
      } finally {
        if (!cancelled) setLoadingConfig(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // ── Load plan + transactions whenever the month changes ───────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingMonth(true);
    (async () => {
      try {
        const [p, tx] = await Promise.all([
          fetchPlanWithFallback(supabase, currentMonth),
          fetchTransactionsForMonth(supabase, currentMonth),
        ]);
        if (cancelled) return;
        setPlan(p);
        setTransactions(tx);
      } catch (err) {
        if (!cancelled) setSaveError(err instanceof Error ? err.message : 'Load failed');
      } finally {
        if (!cancelled) setLoadingMonth(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentMonth, supabase]);

  // ── Debounced save infrastructure ─────────────────────────────────────
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const inflightRef = useRef(0);

  const runSave = useCallback(async (task: () => Promise<void>) => {
    inflightRef.current += 1;
    setSaving(true);
    setSaveError(null);
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await task();
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 300 + attempt * 400));
      }
    }
    inflightRef.current -= 1;
    if (inflightRef.current === 0) setSaving(false);
    if (lastErr) {
      setSaveError(lastErr instanceof Error ? lastErr.message : 'Save failed');
      console.error(lastErr);
    }
  }, []);

  const debounce = useCallback(
    (key: string, delay: number, task: () => Promise<void>) => {
      if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
      saveTimers.current[key] = setTimeout(() => runSave(task), delay);
    },
    [runSave]
  );

  // ── Mutations ─────────────────────────────────────────────────────────
  const saveCategory = useCallback(
    (next: Category) => {
      setCategories((prev) => {
        const i = prev.findIndex((c) => c.id === next.id);
        if (i === -1) return [...prev, next];
        const copy = prev.slice();
        copy[i] = next;
        return copy;
      });
      debounce(`cat:${next.id}`, 600, () => upsertCategory(supabase, next));
    },
    [debounce, supabase]
  );

  const removeCategory = useCallback(
    (id: string) => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      runSave(() => deleteCategory(supabase, id));
    },
    [runSave, supabase]
  );

  const updatePlanEntry = useCallback(
    (catId: string, amount: number) => {
      setPlan((prev) => ({ ...prev, [catId]: amount }));
      debounce(`plan:${currentMonth}:${catId}`, 600, () =>
        writePlan(supabase, currentMonth, { [catId]: amount })
      );
    },
    [debounce, supabase, currentMonth]
  );

  const replacePlan = useCallback(
    (next: Plan) => {
      setPlan(next);
      debounce(`plan:${currentMonth}:bulk`, 300, () => writePlan(supabase, currentMonth, next));
    },
    [debounce, supabase, currentMonth]
  );

  const addTransaction = useCallback(
    (tx: Transaction) => {
      setTransactions((prev) => [tx, ...prev]);
      runSave(() => insertTransaction(supabase, tx));
    },
    [runSave, supabase]
  );

  const removeTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      runSave(() => deleteTransaction(supabase, id));
    },
    [runSave, supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }, [supabase]);

  // ── Derived totals ────────────────────────────────────────────────────
  const tracked = useMemo(() => {
    const out: Record<string, number> = {};
    for (const t of transactions) out[t.categoryId] = (out[t.categoryId] ?? 0) + t.amount;
    return out;
  }, [transactions]);

  const totals: Totals = useMemo(() => {
    const byType = {
      income: { planned: 0, tracked: 0 },
      expense: { planned: 0, tracked: 0 },
      savings: { planned: 0, tracked: 0 },
    };
    for (const c of categories) {
      const planned = plan[c.id] ?? c.defaultAmount ?? 0;
      byType[c.type].planned += planned;
      byType[c.type].tracked += tracked[c.id] ?? 0;
    }
    return {
      ...byType,
      toAllocate: byType.income.planned - byType.expense.planned - byType.savings.planned,
      netTracked: byType.income.tracked - byType.expense.tracked - byType.savings.tracked,
    };
  }, [categories, plan, tracked]);

  const loading = loadingConfig || loadingMonth;
  const isCurrentMonth = currentMonth === ymKey();

  return (
    <div className="min-h-screen w-full bg-cream pb-24 text-ink">
      <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8 sm:py-8">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="hairline mb-6 flex items-start justify-between gap-4 border-b pb-5">
          <div>
            <div className="label-tag">The Ledger · Personal Finance</div>
            <div className="mt-1 flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth(shiftMonth(currentMonth, -1))}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5"
                aria-label="Previous month"
              >
                <ChevronLeft size={17} />
              </button>
              <h1 className="font-display text-3xl font-semibold leading-none tracking-tightest-2 sm:text-4xl">
                {formatMonthLong(currentMonth)}
              </h1>
              <button
                onClick={() => setCurrentMonth(shiftMonth(currentMonth, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/5"
                aria-label="Next month"
              >
                <ChevronRight size={17} />
              </button>
              {!isCurrentMonth ? (
                <button
                  onClick={() => setCurrentMonth(ymKey())}
                  className="ml-1 rounded-full bg-ink/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
                >
                  Today
                </button>
              ) : null}
            </div>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted hover:bg-ink/5 hover:text-ink"
            aria-label="Sign out"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </header>

        {loading ? (
          <div className="py-20 text-center text-sm text-muted">Loading your ledger…</div>
        ) : (
          <main className="animate-fadein">
            {tab === 'dashboard' ? (
              <Dashboard
                currentMonth={currentMonth}
                categories={categories}
                plan={plan}
                tracked={tracked}
                totals={totals}
              />
            ) : null}
            {tab === 'log' ? (
              <LogView
                categories={categories}
                transactions={transactions}
                onAdd={addTransaction}
                onRemove={removeTransaction}
              />
            ) : null}
            {tab === 'plan' ? (
              <PlanView
                currentMonth={currentMonth}
                categories={categories}
                plan={plan}
                onUpdate={updatePlanEntry}
                onReplace={replacePlan}
                supabaseClient={supabase}
              />
            ) : null}
            {tab === 'setup' ? (
              <SetupView categories={categories} onSave={saveCategory} onRemove={removeCategory} />
            ) : null}
          </main>
        )}
      </div>

      {/* ── Bottom nav ────────────────────────────────────────── */}
      <nav
        className="hairline fixed bottom-0 left-0 right-0 border-t"
        style={{
          backgroundColor: '#F5EFE4EE',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div className="mx-auto grid max-w-3xl grid-cols-4 text-center">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex flex-col items-center gap-0.5 py-3 transition-opacity"
              style={{ opacity: tab === id ? 1 : 0.42 }}
            >
              <Icon size={18} strokeWidth={tab === id ? 2.2 : 1.8} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {saving && !saveError ? (
        <div className="fixed bottom-20 right-5 rounded-full bg-ink px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-cream">
          Saving…
        </div>
      ) : null}
      {saveError ? (
        <div className="fixed bottom-20 left-5 right-5 flex items-center gap-2 rounded-lg bg-expense px-3 py-2 text-xs text-cream sm:left-auto sm:right-5 sm:max-w-xs">
          <AlertCircle size={14} />
          <span className="flex-1">Couldn’t save: {saveError}</span>
          <button onClick={() => setSaveError(null)} className="opacity-70">
            ✕
          </button>
        </div>
      ) : null}
    </div>
  );
}
