'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import type { Episode, UpNextItem } from '@/lib/tv/types';
import { imageUrl } from '@/lib/tv/tmdb';
import { episodeCode, formatAirDate } from '@/lib/tv/format';
import { markWatched } from '@/app/tv/actions';

export function UpNextCard({
  item,
  onMarked,
}: {
  item: UpNextItem;
  onMarked?: (episode: Episode) => void;
}) {
  const { show, next } = item;
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  if (!next) return null;

  const still = imageUrl(next.stillPath, 'w300') ?? imageUrl(show.posterPath, 'w185');
  const pct = item.airedTotal ? Math.round((item.airedWatched / item.airedTotal) * 100) : 0;

  function mark() {
    if (!next) return;
    setFailed(false);
    startTransition(async () => {
      try {
        await markWatched(show.tmdbId, next.seasonNumber, next.episodeNumber);
        onMarked?.(next);
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div
      className={`flex items-stretch gap-4 card border border-hairline p-3 transition-all duration-300 ${
        pending ? 'scale-[0.98] opacity-0' : 'opacity-100'
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
          className="truncate font-display text-lg leading-tight font-semibold tracking-tightest-2 hover:underline"
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
            <span className="block h-full rounded-full bg-income" style={{ width: `${pct}%` }} />
          </span>
          {next.airDate ? <span>· aired {formatAirDate(next.airDate)}</span> : null}
        </div>
        {failed ? (
          <p role="alert" className="mt-2 text-xs text-expense">
            Couldn&apos;t mark it watched.{' '}
            <button
              onClick={mark}
              className="-my-2 px-1 py-2 font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          </p>
        ) : null}
      </div>

      <button
        onClick={mark}
        disabled={pending}
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
