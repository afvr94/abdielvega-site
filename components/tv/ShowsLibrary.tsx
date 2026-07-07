'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { LibraryItem, TvListWithCount } from '@/lib/tv/types';
import { imageUrl } from '@/lib/tv/tmdb';
import { formatAirDate } from '@/lib/tv/format';

type Filter = 'all' | 'watchlist' | 'not-started' | 'behind' | 'caught-up' | 'done' | 'archived';

// Production statuses that mean the show won't get new episodes.
const DONE_STATUSES = new Set(['Ended', 'Canceled']);

// Watchlist and archived shows live in their own lanes, out of the progress filters.
const isActive = (i: LibraryItem) => !i.archived && !i.watchlist;

function isWatchlist(i: LibraryItem) {
  return !i.archived && i.watchlist;
}
function isNotStarted(i: LibraryItem) {
  return isActive(i) && i.airedTotal > 0 && i.airedWatched === 0;
}
function isBehind(i: LibraryItem) {
  return isActive(i) && i.airedWatched > 0 && i.airedWatched < i.airedTotal;
}
function isCaughtUp(i: LibraryItem) {
  return isActive(i) && i.airedTotal > 0 && i.airedWatched >= i.airedTotal;
}
function isDone(i: LibraryItem) {
  return isActive(i) && !!i.show.status && DONE_STATUSES.has(i.show.status);
}

export function ShowsLibrary({ items, lists }: { items: LibraryItem[]; lists: TvListWithCount[] }) {
  const [filter, setFilter] = useState<Filter>('behind');
  const [listId, setListId] = useState<number | null>(null);

  // The status tabs operate within the selected list (or the whole library).
  const scoped = useMemo(
    () => (listId == null ? items : items.filter((i) => i.listIds.includes(listId))),
    [items, listId]
  );

  const counts = useMemo(
    () => ({
      all: scoped.filter(isActive).length,
      watchlist: scoped.filter(isWatchlist).length,
      'not-started': scoped.filter(isNotStarted).length,
      behind: scoped.filter(isBehind).length,
      'caught-up': scoped.filter(isCaughtUp).length,
      done: scoped.filter(isDone).length,
      archived: scoped.filter((i) => i.archived).length,
    }),
    [scoped]
  );

  const shown = scoped.filter((i) => {
    if (filter === 'all') return isActive(i);
    if (filter === 'watchlist') return isWatchlist(i);
    if (filter === 'not-started') return isNotStarted(i);
    if (filter === 'behind') return isBehind(i);
    if (filter === 'caught-up') return isCaughtUp(i);
    if (filter === 'done') return isDone(i);
    return i.archived;
  });

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'watchlist', label: 'Watchlist' },
    { key: 'not-started', label: 'Not started' },
    { key: 'behind', label: 'Behind' },
    { key: 'caught-up', label: 'Caught up' },
    { key: 'done', label: 'Done' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tightest-3">Shows</h1>
      </div>

      {lists.length > 0 ? (
        <div className="no-scrollbar -mx-5 mb-3 flex items-center gap-1.5 overflow-x-auto px-5">
          <button
            onClick={() => setListId(null)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              listId == null
                ? 'border-savings bg-savings text-white'
                : 'border-hairline text-muted hover:text-ink'
            }`}
          >
            All lists
          </button>
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => setListId(l.id)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                listId === l.id
                  ? 'border-savings bg-savings text-white'
                  : 'border-hairline text-muted hover:text-ink'
              }`}
            >
              {l.name}
              <span className="font-mono-tab ml-1.5 opacity-60">{l.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="no-scrollbar -mx-5 mb-5 flex gap-1.5 overflow-x-auto px-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === t.key ? 'bg-ink text-cream' : 'text-muted hover:text-ink'
            }`}
          >
            {t.label}
            <span className="font-mono-tab ml-1.5 opacity-60">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">Nothing here.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {shown.map((i) => {
            const poster = imageUrl(i.show.posterPath, 'w342');
            const behind = i.airedTotal - i.airedWatched;
            const pct = i.airedTotal ? Math.round((i.airedWatched / i.airedTotal) * 100) : 0;
            return (
              <Link key={i.show.tmdbId} href={`/show/${i.show.tmdbId}`} className="group">
                <div
                  className={`relative aspect-[2/3] overflow-hidden rounded-lg bg-cream ${
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
                    <span className="font-mono-tab absolute right-1.5 top-1.5 rounded-full bg-expense px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {behind}
                    </span>
                  ) : null}
                  <span className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
                    <span className="block h-full bg-income" style={{ width: `${pct}%` }} />
                  </span>
                </div>
                <div className="mt-1.5 truncate text-xs font-medium leading-tight text-ink">
                  {i.show.name}
                </div>
                <div className="font-mono-tab text-[10px] text-muted">
                  {isCaughtUp(i) && i.nextAirDate
                    ? `returns ${formatAirDate(i.nextAirDate)}`
                    : `${i.airedWatched}/${i.airedTotal}`}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
