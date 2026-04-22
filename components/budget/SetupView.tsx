'use client';

import { Plus, Trash2 } from 'lucide-react';
import { TYPE_META, TYPE_ORDER } from '@/lib/budget/theme';
import type { Category, CategoryType } from '@/lib/budget/types';
import { newId } from '@/lib/budget/utils';

type Props = {
  categories: Category[];
  onSave: (cat: Category) => void;
  onRemove: (id: string) => void;
};

export function SetupView({ categories, onSave, onRemove }: Props) {
  function updateCat(c: Category, patch: Partial<Category>) {
    onSave({ ...c, ...patch });
  }

  function addCat(type: CategoryType) {
    const maxSort = categories.reduce((m, c) => Math.max(m, c.sortOrder), 0);
    onSave({
      id: newId('cat'),
      name: 'New category',
      type,
      defaultAmount: 0,
      sortOrder: maxSort + 10,
    });
  }

  return (
    <div>
      <section className="mb-5">
        <div className="label-tag mb-1">Setup</div>
        <h2 className="font-display text-3xl font-semibold">Categories &amp; defaults</h2>
        <p className="mt-1 text-sm text-muted">
          Add, remove, or rename the buckets you track. Default amounts fill in when you create a
          plan for a new month.
        </p>
      </section>

      {TYPE_ORDER.map((typeKey) => {
        const cats = categories.filter((c) => c.type === typeKey);
        const info = TYPE_META[typeKey];
        return (
          <section key={typeKey} className="mb-5">
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h3 className="font-display text-lg font-semibold" style={{ color: info.color }}>
                {info.label}
              </h3>
              <span className="label-tag">{cats.length}</span>
            </div>
            <div className="card mb-2 overflow-hidden">
              {cats.length === 0 ? (
                <div className="px-4 py-5 text-center text-xs text-muted">
                  No {info.label.toLowerCase()} categories yet
                </div>
              ) : (
                cats.map((c, i) => (
                  <div
                    key={c.id}
                    className={`flex items-center gap-2 px-3 py-2 ${
                      i < cats.length - 1 ? 'hairline border-b' : ''
                    }`}
                  >
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => updateCat(c, { name: e.target.value })}
                      className="focus-ring flex-1 rounded bg-transparent px-2 py-1.5 text-sm font-medium"
                    />
                    <span className="font-display text-base text-muted">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={c.defaultAmount || ''}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        updateCat(c, { defaultAmount: parseFloat(e.target.value) || 0 })
                      }
                      className="focus-ring font-mono-tab w-20 rounded bg-ink/[0.03] px-2 py-1.5 text-right text-sm"
                    />
                    <button
                      onClick={() => onRemove(c.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-ink/5"
                      aria-label="Remove"
                    >
                      <Trash2 size={13} className="text-muted" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => addCat(typeKey)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink/[0.04] py-2.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: info.color }}
            >
              <Plus size={13} /> Add {info.label.toLowerCase()}
            </button>
          </section>
        );
      })}
    </div>
  );
}
