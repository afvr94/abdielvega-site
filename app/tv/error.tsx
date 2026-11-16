'use client';

import { useEffect } from 'react';

export default function TvError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card border border-hairline p-6 text-center">
      <h1 className="font-display text-xl font-semibold tracking-tightest-2">
        Couldn&apos;t load this page
      </h1>
      <p className="mt-1.5 text-sm text-muted">Check your connection and try again.</p>
      <button
        onClick={() => retry()}
        className="mt-4 inline-flex items-center rounded-full border border-hairline bg-ink/10 px-4 py-2 text-xs font-semibold tracking-wider text-ink uppercase transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
