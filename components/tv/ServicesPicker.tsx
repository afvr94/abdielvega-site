'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import type { Provider } from '@/lib/tv/types';
import { imageUrl } from '@/lib/tv/tmdb';
import { setServices } from '@/app/tv/actions';

export function ServicesPicker({
  options,
  initial,
}: {
  options: { provider: Provider; shows: number }[];
  initial: number[];
}) {
  const [selected, setSelected] = useState(initial);
  const [failed, setFailed] = useState(false);
  const [, startSave] = useTransition();

  function toggle(id: number) {
    const before = selected;
    const next = before.includes(id) ? before.filter((s) => s !== id) : [...before, id];
    setSelected(next);
    setFailed(false);
    startSave(async () => {
      try {
        await setServices(next);
      } catch {
        setSelected(before);
        setFailed(true);
      }
    });
  }

  return (
    <div>
      {failed ? (
        <p role="alert" className="mb-3 text-xs text-expense">
          Couldn&apos;t save. Try again.
        </p>
      ) : null}
      <ul className="space-y-1.5">
        {options.map(({ provider, shows }) => {
          const on = selected.includes(provider.id);
          const logo = imageUrl(provider.logoPath, 'w92');
          return (
            <li key={provider.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => toggle(provider.id)}
                className={`flex w-full items-center gap-3 card border p-2.5 text-left transition-colors ${
                  on ? 'border-income' : 'border-hairline hover:border-ink/25'
                }`}
              >
                <span className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-cream">
                  {logo ? <Image src={logo} alt="" fill sizes="36px" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{provider.name}</span>
                  <span className="block text-[11px] text-muted">
                    {shows} {shows === 1 ? 'show' : 'shows'} you follow
                  </span>
                </span>
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
                    on ? 'border-income bg-income text-cream' : 'border-hairline'
                  }`}
                >
                  {on ? <Check size={14} strokeWidth={3} /> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
