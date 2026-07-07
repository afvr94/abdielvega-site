'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import type { UpNextItem } from '@/lib/tv/types';
import { imageUrl } from '@/lib/tv/tmdb';
import { episodeCode, formatAirDate } from '@/lib/tv/format';
import { markWatched } from '@/app/tv/actions';

export function UpNextCard({ item }: { item: UpNextItem }) {
  const { show, next } = item;
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (!next) return null;

  const still = imageUrl(next.stillPath, 'w300') ?? imageUrl(show.posterPath, 'w185');
  const pct = item.airedTotal ? Math.round((item.airedWatched / item.airedTotal) * 100) : 0;

  function mark() {
    if (!next) return;
    setDone(true);
    startTransition(async () => {
      await markWatched(show.tmdbId, next.seasonNumber, next.episodeNumber);
    });
  }

  return (
    <div
      className={`card flex items-stretch gap-4 border border-hairline p-3 transition-all duration-300 ${
        done ? 'scale-[0.98] opacity-0' : 'opacity-100'
      }`}
    >
      <Link
        href={`/show/${show.tmdbId}`}
        className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-cream sm:w-40"
      >
        {still ? <Image src={still} alt="" fill sizes="160px" className="object-cover" /> : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <Link
          href={`/show/${show.tmdbId}`}
          className="truncate font-display text-lg font-semibold leading-tight tracking-tightest-2 hover:underline"
        >
          {show.name}
        </Link>
        <div className="mt-1 flex items-baseline gap-2 text-sm">
          <span className="font-mono-tab text-xs text-muted">
            {episodeCode(next.seasonNumber, next.episodeNumber)}
          </span>
          <span className="truncate text-ink">{next.name ?? '—'}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted">
          <span className="font-mono-tab">
            {item.airedWatched}/{item.airedTotal}
          </span>
          <span className="h-1 w-20 overflow-hidden rounded-full bg-hairline">
            <span className="block h-full rounded-full bg-ink/60" style={{ width: `${pct}%` }} />
          </span>
          {next.airDate ? <span>· aired {formatAirDate(next.airDate)}</span> : null}
        </div>
      </div>

      <button
        onClick={mark}
        disabled={pending || done}
        aria-label={`Mark ${episodeCode(next.seasonNumber, next.episodeNumber)} watched`}
        className="group flex w-14 shrink-0 items-center justify-center rounded-lg border border-hairline bg-card transition-colors hover:border-income hover:bg-income/5 disabled:opacity-60"
      >
        <Check
          size={22}
          strokeWidth={2.5}
          className="text-muted transition-colors group-hover:text-income"
        />
      </button>
    </div>
  );
}
