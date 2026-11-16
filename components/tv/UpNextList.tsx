'use client';

import { useEffect, useState, useTransition } from 'react';
import type { Episode, Show, UpNextItem } from '@/lib/tv/types';
import { episodeCode } from '@/lib/tv/format';
import { markUnwatched } from '@/app/tv/actions';
import { UpNextCard } from './UpNextCard';

type Marked = { show: Show; episode: Episode; failed: boolean };

export function UpNextList({ items }: { items: UpNextItem[] }) {
  // Lives above the cards so the undo survives the marked card being replaced.
  const [marked, setMarked] = useState<Marked | null>(null);
  const [undoing, startTransition] = useTransition();

  useEffect(() => {
    if (!marked || undoing || marked.failed) return;
    const timer = setTimeout(() => setMarked(null), 5000);
    return () => clearTimeout(timer);
  }, [marked, undoing]);

  function undo() {
    if (!marked) return;
    const { show, episode } = marked;
    startTransition(async () => {
      try {
        await markUnwatched(show.tmdbId, episode.seasonNumber, episode.episodeNumber);
        setMarked(null);
      } catch {
        setMarked({ show, episode, failed: true });
      }
    });
  }

  return (
    <>
      <div className="rise space-y-3">
        {items.map((item) => (
          <UpNextCard
            key={`${item.show.tmdbId}-${item.next?.tmdbId}`}
            item={item}
            onMarked={(episode) => setMarked({ show: item.show, episode, failed: false })}
          />
        ))}
      </div>
      {marked ? (
        <div
          role="status"
          className="fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-5 sm:bottom-[calc(1.25rem+env(safe-area-inset-bottom))]"
        >
          <div className="flex max-w-full items-center gap-2 rounded-full border border-hairline bg-card py-1 pr-1 pl-4 text-sm">
            <span className="min-w-0 truncate">
              {marked.failed ? (
                <span className="text-expense">Couldn&apos;t undo.</span>
              ) : (
                <>
                  {marked.show.name}{' '}
                  <span className="font-mono-tab text-xs text-muted">
                    {episodeCode(marked.episode.seasonNumber, marked.episode.episodeNumber)}
                  </span>{' '}
                  watched
                </>
              )}
            </span>
            <button
              onClick={undo}
              disabled={undoing}
              className="min-h-11 shrink-0 rounded-full px-4 text-xs font-semibold tracking-wider text-income uppercase disabled:opacity-60"
            >
              {marked.failed ? 'Retry' : 'Undo'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
