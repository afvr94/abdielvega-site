'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { TYPE_META, TYPE_ORDER } from '@/lib/budget/theme';
import type { Category, CategoryType, Transaction } from '@/lib/budget/types';
import { fmtUSDc, newId } from '@/lib/budget/utils';

type Props = {
  categories: Category[];
  transactions: Transaction[];
  onAdd: (tx: Transaction) => void;
  onRemove: (id: string) => void;
};

export function LogView({ categories, transactions, onAdd, onRemove }: Props) {
  const [type, setType] = useState<CategoryType>('expense');
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const catsOfType = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (!catsOfType.find((c) => c.id === categoryId) && catsOfType.length) {
      setCategoryId(catsOfType[0]!.id);
    }
  }, [type, catsOfType, categoryId]);

  const canAdd = parseFloat(amount) > 0 && Boolean(categoryId);

  function add() {
    if (!canAdd) return;
    onAdd({
      id: newId('tx'),
      date: new Date(date).toISOString(),
      categoryId,
      amount: parseFloat(amount),
      note: note.trim() || null,
    });
    setAmount('');
    setNote('');
  }

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div>
      <section className="card mb-6 p-5">
        <div className="label-tag mb-4">Record a transaction</div>

        {/* Type pills */}
        <div className="mb-4 flex gap-2">
          {TYPE_ORDER.map((k) => {
            const info = TYPE_META[k];
            return (
              <button
                key={k}
                onClick={() => setType(k)}
                className="flex-1 rounded-full py-2 text-xs font-semibold uppercase tracking-wider transition-all"
                style={{
                  backgroundColor: type === k ? info.color : '#1A181508',
                  color: type === k ? '#F5EFE4' : '#1A1815',
                }}
              >
                {info.label}
              </button>
            );
          })}
        </div>

        {/* Amount */}
        <div className="hairline mb-4 flex items-center gap-3 border-b pb-3">
          <span className="font-display text-3xl text-muted">$</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            onFocus={(e) => e.target.select()}
            className="w-full flex-1 border-none bg-transparent font-display text-4xl font-medium sm:text-5xl"
          />
          <button
            onClick={add}
            disabled={!canAdd}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream disabled:opacity-30"
          >
            <Plus size={15} /> Add
          </button>
        </div>

        {/* Category chips */}
        {catsOfType.length ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {catsOfType.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  backgroundColor: categoryId === c.id ? '#1A1815' : '#1A18150E',
                  color: categoryId === c.id ? '#F5EFE4' : '#1A1815',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-3 text-xs text-muted">
            No {type} categories yet. Add some in Setup.
          </div>
        )}

        {/* Note + date */}
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            className="focus-ring rounded-lg bg-ink/[0.04] px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="focus-ring font-mono-tab rounded-lg bg-ink/[0.04] px-3 py-2 text-sm"
          />
        </div>
      </section>

      {/* List */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold">All transactions</h2>
          <span className="label-tag">{sorted.length} entries</span>
        </div>
        {sorted.length === 0 ? (
          <div className="card py-10 text-center text-sm text-muted">
            No transactions logged this month.
          </div>
        ) : (
          <ul className="card divide-y divide-hairline overflow-hidden">
            {sorted.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              const info = cat ? TYPE_META[cat.type] : null;
              const d = new Date(t.date);
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="font-mono-tab w-11 text-[10px] leading-tight text-muted">
                    {d
                      .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {t.note || cat?.name || 'Transaction'}
                    </div>
                    <div className="text-[11px]" style={{ color: info?.color ?? '#8A8178' }}>
                      {cat?.name ?? 'Unknown'}
                      {info ? ` · ${info.label}` : ''}
                    </div>
                  </div>
                  <div
                    className="font-mono-tab text-sm font-semibold"
                    style={{
                      color:
                        cat?.type === 'income'
                          ? '#4A6741'
                          : cat?.type === 'expense'
                            ? '#B54228'
                            : '#2E5266',
                    }}
                  >
                    {cat?.type === 'income' ? '+' : '−'}
                    {fmtUSDc(t.amount)}
                  </div>
                  <button
                    onClick={() => onRemove(t.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5"
                    aria-label="Delete"
                  >
                    <Trash2 size={13} className="text-muted" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
