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

  function toggle() {
    const next = !followed;
    startTransition(async () => {
      if (next) {
        await followShow(tmdbId);
      } else {
        await unfollowShow(tmdbId);
      }
      setFollowed(next);
    });
  }

  const base = size === 'lg' ? 'px-5 py-2.5 text-xs' : 'px-3 py-1.5 text-[11px]';

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider transition-colors disabled:opacity-70 ${base} ${
        followed
          ? 'border border-hairline bg-white text-muted hover:text-ink'
          : 'bg-ink text-cream hover:opacity-90'
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
  );
}
