'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { LibraryItem, TvListWithCount } from '@/lib/tv/types';
import { imageUrl } from '@/lib/tv/tmdb';
import { formatAirDate } from '@/lib/tv/format';
import { archiveShows } from '@/app/tv/actions';

// Production statuses that mean the show won't get new episodes.
const DONE_STATUSES = new Set(['Ended', 'Canceled']);

// Watchlist and archived shows live in their own lanes, out of the progress filters.
const isActive = (i: LibraryItem) => !i.archived && !i.watchlist;

function isWatchlist(i: LibraryItem) {
  return !i.archived && i.watchlist;
}
function isNotStarted(i: LibraryItem) {
  return isActive(i) && !i.dormant && i.airedTotal > 0 && i.airedWatched === 0;
}
function isBehind(i: LibraryItem) {
  return isActive(i) && !i.dormant && i.airedWatched > 0 && i.airedWatched < i.airedTotal;
}
function isDormant(i: LibraryItem) {
  return isActive(i) && i.dormant;
}
function isCaughtUp(i: LibraryItem) {
  return isActive(i) && i.airedTotal > 0 && i.airedWatched >= i.airedTotal;
}
function isDone(i: LibraryItem) {
  return isActive(i) && !!i.show.status && DONE_STATUSES.has(i.show.status);
}

const FILTERS = [
  { key: 'all', label: 'All', match: isActive },
  { key: 'watchlist', label: 'Watchlist', match: isWatchlist },
  { key: 'not-started', label: 'Not started', match: isNotStarted },
  { key: 'behind', label: 'Behind', match: isBehind },
  { key: 'dormant', label: 'Dormant', match: isDormant },
  { key: 'caught-up', label: 'Caught up', match: isCaughtUp },
  { key: 'done', label: 'Done', match: isDone },
  { key: 'archived', label: 'Archived', match: (i: LibraryItem) => i.archived },
] as const;

type Filter = (typeof FILTERS)[number]['key'];

export function ShowsLibrary({
  items,
  lists,
  initialFilter,
}: {
  items: LibraryItem[];
  lists: TvListWithCount[];
  initialFilter?: string;
}) {
  const [filter, setFilter] = useState<Filter>(
    () => FILTERS.find((f) => f.key === initialFilter)?.key ?? 'behind'
  );
  const [archiving, startArchive] = useTransition();
  const [listId, setListId] = useState<number | null>(null);
  const activeChip = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeChip.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, []);

  // The status tabs operate within the selected list (or the whole library).
  const scoped = useMemo(
    () => (listId == null ? items : items.filter((i) => i.listIds.includes(listId))),
    [items, listId]
  );

  const counts = useMemo(
    () => new Map(FILTERS.map((f) => [f.key, scoped.filter(f.match).length])),
    [scoped]
  );

  const shown = scoped.filter((i) => FILTERS.some((f) => f.key === filter && f.match(i)));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tightest-3">Shows</h1>
      </div>

      {lists.length > 0 ? (
        <div className="-mx-5 mb-3 no-scrollbar flex items-center gap-1.5 overflow-x-auto px-5">
          <button
            onClick={() => setListId(null)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              listId == null
                ? 'border-savings bg-savings text-cream'
                : 'border-hairline text-muted hover:text-ink'
            }`}
          >
            All lists
          </button>
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => setListId(l.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                listId === l.id
                  ? 'border-savings bg-savings text-cream'
                  : 'border-hairline text-muted hover:text-ink'
              }`}
            >
              {l.name}
              <span className="ml-1.5 font-mono-tab opacity-80">{l.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="-mx-5 mb-5 no-scrollbar flex gap-1.5 overflow-x-auto px-5">
        {FILTERS.map((t) => (
          <button
            key={t.key}
            ref={t.key === filter ? activeChip : undefined}
            onClick={() => setFilter(t.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === t.key
                ? 'border border-hairline bg-ink/10 text-ink'
                : 'border border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
            <span className="ml-1.5 font-mono-tab opacity-80">{counts.get(t.key)}</span>
          </button>
        ))}
      </div>

      {filter === 'dormant' && shown.length > 0 ? (
        <div className="mb-5 flex items-center justify-between gap-3 card border border-hairline p-4">
          <p className="text-sm leading-snug text-muted">
            Behind, and untouched for 6 months. Archive the ones you&apos;re done with.
          </p>
          <button
            type="button"
            disabled={archiving}
            onClick={() => startArchive(() => archiveShows(shown.map((i) => i.show.tmdbId)))}
            className="shrink-0 rounded-full bg-expense px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {archiving ? 'Archiving…' : `Archive all ${shown.length}`}
          </button>
        </div>
      ) : null}

      {shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">Nothing here.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {shown.map((i) => {
            const poster = imageUrl(i.show.posterPath, 'w342');
            const behind = i.airedTotal - i.airedWatched;
            const pct = i.airedTotal ? Math.round((i.airedWatched / i.airedTotal) * 100) : 0;
            return (
              <div key={i.show.tmdbId}>
                <Link href={`/show/${i.show.tmdbId}`} className="group block">
                  <div
                    className={`relative aspect-2/3 overflow-hidden rounded-lg bg-cream ${
                      i.archived ? 'opacity-50' : ''
                    }`}
                  >
                    {poster ? (
                      <Image
                        src={poster}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 33vw, 20vw"
                        className="object-cover transition-transform group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-2 text-center font-display text-sm text-muted">
                        {i.show.name}
                      </div>
                    )}
                    {behind > 0 && !i.archived ? (
                      <span className="absolute top-1.5 right-1.5 rounded-full bg-expense px-1.5 py-0.5 font-mono-tab text-[10px] font-semibold text-cream">
                        {behind}
                      </span>
                    ) : null}
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
                      <span className="block h-full bg-income" style={{ width: `${pct}%` }} />
                    </span>
                  </div>
                  <div className="mt-1.5 truncate text-xs leading-tight font-medium text-ink">
                    {i.show.name}
                  </div>
                  <div className="font-mono-tab text-[10px] text-muted">
                    {isCaughtUp(i) && i.nextAirDate
                      ? `returns ${formatAirDate(i.nextAirDate)}`
                      : `${i.airedWatched}/${i.airedTotal}`}
                  </div>
                </Link>
                {filter === 'dormant' ? (
                  <button
                    type="button"
                    disabled={archiving}
                    onClick={() => startArchive(() => archiveShows([i.show.tmdbId]))}
                    aria-label={`Archive ${i.show.name}`}
                    className="mt-1.5 w-full rounded-full border border-hairline bg-card py-2 text-[11px] font-semibold text-muted transition-colors hover:text-ink disabled:opacity-50"
                  >
                    Archive
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
