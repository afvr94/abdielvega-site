'use client';

import { useState, useTransition } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { addToWatchlist } from '@/app/tv/actions';

// Quick-add a show to the watchlist from search results.
export function WantToWatchButton({ tmdbId }: { tmdbId: number }) {
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function add() {
    if (saved || pending) return;
    startTransition(async () => {
      await addToWatchlist(tmdbId);
      setSaved(true);
    });
  }

  return (
    <button
      onClick={add}
      disabled={saved || pending}
      aria-label="Add to watchlist"
      title="Watch later"
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-70 ${
        saved
          ? 'border-savings bg-savings text-white'
          : 'border-hairline bg-card text-muted hover:border-savings hover:text-savings'
      }`}
    >
      {pending ? (
        <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
      ) : (
        <Bookmark size={14} strokeWidth={2.2} fill={saved ? 'currentColor' : 'none'} />
      )}
    </button>
  );
}
