'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, Star } from 'lucide-react';
import type { Episode } from '@/lib/tv/types';
import { imageUrl } from '@/lib/tv/tmdb';
import { dateIso, episodeCode, formatAirDate } from '@/lib/tv/format';
import { getEpisodeSheet, type EpisodeSheetData } from '@/app/tv/actions';

const SWIPE_CLOSE_PX = 80;

export function EpisodeSheet({
  showId,
  episode,
  watched,
  onToggle,
  onClose,
}: {
  showId: number;
  episode: Episode;
  watched: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const dragFrom = useRef<number | null>(null);
  const [data, setData] = useState<EpisodeSheetData | null>(null);
  const [failed, setFailed] = useState(false);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const { seasonNumber: season, episodeNumber: number } = episode;

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    let live = true;
    getEpisodeSheet(showId, season, number).then(
      (d) => live && setData(d),
      () => live && setFailed(true)
    );
    return () => {
      live = false;
    };
  }, [showId, season, number]);

  const showSpoilers = watched || spoilerRevealed;
  const still = imageUrl(episode.stillPath, 'w780');
  const code = episodeCode(season, number);
  const meta = [
    code,
    data?.runtime ? `${data.runtime} min` : null,
    episode.airDate ? formatAirDate(episode.airDate) : null,
  ].filter(Boolean);

  return (
    <dialog
      ref={dialog}
      aria-label={`${code} details`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="cliffo-sheet mx-0 mt-auto mb-0 max-h-[90dvh] w-full max-w-none overflow-y-auto bg-transparent p-0 text-ink backdrop:bg-black/55 sm:mx-auto sm:max-w-lg"
    >
      <div className="rounded-t-[26px] border border-b-0 border-hairline bg-card px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div
          aria-hidden
          className="-mx-5 cursor-grab touch-none pt-2.5 pb-3"
          onPointerDown={(e) => (dragFrom.current = e.clientY)}
          onPointerUp={(e) => {
            if (dragFrom.current !== null && e.clientY - dragFrom.current > SWIPE_CLOSE_PX) {
              dialog.current?.close();
            }
            dragFrom.current = null;
          }}
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-hairline" />
        </div>

        <div className="relative aspect-video overflow-hidden rounded-2xl bg-cream">
          {still ? (
            <Image
              src={still}
              alt=""
              fill
              sizes="512px"
              className={`object-cover ${showSpoilers ? '' : 'scale-110 blur-xl'}`}
            />
          ) : null}
        </div>

        {showSpoilers ? (
          <h2 className="mt-3 font-display text-xl leading-tight font-semibold">
            {episode.name ?? code}
          </h2>
        ) : null}
        <div className="mt-1 font-mono-tab text-xs text-muted">{meta.join(' · ')}</div>

        <div className="mt-3 flex min-h-7 flex-wrap items-center gap-2 text-xs">
          {data?.score ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/10 px-2.5 py-1">
              <Star size={12} className="fill-income text-income" aria-hidden />
              {data.score.voteAverage.toFixed(1)} · {data.score.voteCount.toLocaleString('en-US')}{' '}
              votes
            </span>
          ) : (
            <span className="text-muted">
              {data ? 'No TMDB score yet' : failed ? "Couldn't load details" : 'Loading…'}
            </span>
          )}
          <span className="text-muted">TMDB</span>
        </div>

        {showSpoilers ? (
          data?.overview ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">{data.overview}</p>
          ) : null
        ) : (
          <button
            type="button"
            onClick={() => setSpoilerRevealed(true)}
            className="mt-3 w-full rounded-xl border border-dashed border-hairline px-3 py-3 text-xs text-muted hover:text-ink"
          >
            Title and summary hidden · <span className="text-ink">Show details</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggle}
          className={`mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold ${
            watched ? 'bg-ink/10 text-ink' : 'bg-income text-cream'
          }`}
        >
          {watched ? (
            <>
              <Check size={16} strokeWidth={2.6} aria-hidden />
              {data?.watchedAt
                ? `Watched ${formatAirDate(dateIso(new Date(data.watchedAt)))}`
                : 'Watched'}
              <span className="text-income">· Undo</span>
            </>
          ) : (
            'Mark watched'
          )}
        </button>
      </div>
    </dialog>
  );
}
