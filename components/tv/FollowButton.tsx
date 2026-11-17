'use client';

import { useState, useTransition } from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';
import { followShow, unfollowShow } from '@/app/tv/actions';

export function FollowButton({
  tmdbId,
  initialFollowed,
  size = 'sm',
}: {
  tmdbId: number;
  initialFollowed: boolean;
  size?: 'sm' | 'lg';
}) {
  const [followed, setFollowed] = useState(initialFollowed);
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function toggle() {
    const next = !followed;
    setFailed(false);
    startTransition(async () => {
      try {
        await (next ? followShow(tmdbId) : unfollowShow(tmdbId));
        setFollowed(next);
      } catch {
        setFailed(true);
      }
    });
  }

  const base = size === 'lg' ? 'px-5 py-2.5 text-xs' : 'px-3 py-1.5 text-[11px]';

  return (
    <span className="inline-flex shrink-0 flex-col items-start gap-1">
      <button
        onClick={toggle}
        disabled={pending}
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wider uppercase transition-colors disabled:opacity-70 ${base} ${
          followed
            ? 'border border-hairline bg-card text-muted hover:text-ink'
            : 'border border-income bg-income text-cream hover:opacity-90'
        }`}
      >
        {pending ? (
          <Loader2 size={13} strokeWidth={2.4} className="animate-spin" />
        ) : followed ? (
          <Check size={13} strokeWidth={2.4} />
        ) : (
          <Plus size={13} strokeWidth={2.4} />
        )}
        {pending ? (followed ? 'Removing…' : 'Adding…') : followed ? 'Following' : 'Follow'}
      </button>
      {failed ? (
        <span role="alert" className="text-[11px] text-expense">
          Couldn&apos;t {followed ? 'unfollow' : 'follow'}. Tap to retry.
        </span>
      ) : null}
    </span>
  );
}
