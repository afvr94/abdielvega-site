'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { myService, type Episode, type UpNextItem } from '@/lib/tv/types';
import { imageUrl } from '@/lib/tv/tmdb';
import { episodeCode, formatAirDate } from '@/lib/tv/format';
import { markWatched } from '@/app/tv/actions';
import { ProgressRing } from './ProgressRing';
import { ServiceBadge } from './ServiceBadge';

export function UpNextCard({
  item,
  services,
  onMarked,
}: {
  item: UpNextItem;
  services: number[];
  onMarked?: (episode: Episode) => void;
}) {
  const { show, next } = item;
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);

  if (!next) return null;

  const episodeStill = imageUrl(next.stillPath, 'w300');
  const still = episodeStill ?? imageUrl(show.posterPath, 'w185');
  const blurStill = episodeStill && !spoilerRevealed;
  const service = myService(show.providers, services);
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
        aria-hidden
        tabIndex={-1}
        className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-cream sm:w-40"
      >
        {still ? (
          <Image
            src={still}
            alt=""
            fill
            sizes="160px"
            className={`object-cover ${blurStill ? 'scale-110 blur-md' : ''}`}
          />
        ) : null}
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
          {spoilerRevealed ? (
            <span className="truncate text-ink">{next.name ?? '—'}</span>
          ) : (
            <button
              onClick={() => setSpoilerRevealed(true)}
              aria-label="hidden, show episode title"
              className="-my-2 truncate py-2 text-muted italic hover:text-ink"
            >
              hidden
            </button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
          <ProgressRing decorative pct={pct} className="size-5 p-[3px]" />
          <span className="font-mono-tab">
            {item.airedWatched}/{item.airedTotal}
          </span>
          {next.airDate ? (
            <span className="whitespace-nowrap">aired {formatAirDate(next.airDate)}</span>
          ) : null}
          {service ? <ServiceBadge provider={service} /> : null}
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
        aria-label={`Mark ${show.name} ${episodeCode(next.seasonNumber, next.episodeNumber)} watched`}
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
