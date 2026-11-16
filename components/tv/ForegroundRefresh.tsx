'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STALE_AFTER_MS = 5 * 60_000;

// A home-screen PWA resumes on its last render, so data goes stale while it's hidden.
export function ForegroundRefresh() {
  const router = useRouter();

  useEffect(() => {
    let hiddenAt: number | null = null;
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (hiddenAt !== null) {
        if (Date.now() - hiddenAt >= STALE_AFTER_MS) router.refresh();
        hiddenAt = null;
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [router]);

  return null;
}
