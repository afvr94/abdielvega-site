'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { Check, CheckCheck, Archive, Bookmark } from 'lucide-react';
import type { Episode, Show } from '@/lib/tv/types';
import { watchKey } from '@/lib/tv/types';
import { imageUrl } from '@/lib/tv/tmdb';
import { episodeCode, formatAirDate } from '@/lib/tv/format';
import {
  markWatched,
  markUnwatched,
  markSeasonWatched,
  markWatchedMany,
  setArchived,
  setWatchlist,
} from '@/app/tv/actions';
import { FollowButton } from './FollowButton';

const TODAY = new Date().toISOString().slice(0, 10);
const hasAired = (e: Episode) => !!e.airDate && e.airDate <= TODAY;

export function ShowDetailClient({
  show,
  episodes,
  watchedKeys,
  isFollowed,
  archived,
  watchlist,
}: {
  show: Show;
  episodes: Episode[];
  watchedKeys: string[];
  isFollowed: boolean;
  archived: boolean;
  watchlist: boolean;
}) {
  const [watched, setWatched] = useState<Set<string>>(() => new Set(watchedKeys));
  const [isArchived, setIsArchived] = useState(archived);
  const [isWatchlist, setIsWatchlist] = useState(watchlist);
  const [, startTransition] = useTransition();
  const [neverAsk, setNeverAsk] = useState(false);
  const [prompt, setPrompt] = useState<{ season: number; episode: number } | null>(null);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNeverAsk(localStorage.getItem('tv:neverMarkPrev:' + show.tmdbId) === '1');
    } catch {
      // storage disabled — just keep asking
    }
  }, [show.tmdbId]);

  const seasons = useMemo(
    () => [...new Set(episodes.map((e) => e.seasonNumber))].sort((a, b) => a - b),
    [episodes]
  );
  // Non-special seasons first for the default selection.
  const regularSeasons = seasons.filter((s) => s > 0);

  // Aired non-special progress.
  const airedRegular = useMemo(
    () => episodes.filter((e) => e.seasonNumber > 0 && hasAired(e)),
    [episodes]
  );
  const airedWatched = airedRegular.filter((e) =>
    watched.has(watchKey(e.seasonNumber, e.episodeNumber))
  ).length;
  const pct = airedRegular.length ? Math.round((airedWatched / airedRegular.length) * 100) : 0;

  // Next up = first aired, unwatched, non-special episode in order.
  const nextKey = useMemo(() => {
    const ordered = [...airedRegular].sort(
      (a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber
    );
    const n = ordered.find((e) => !watched.has(watchKey(e.seasonNumber, e.episodeNumber)));
    return n ? watchKey(n.seasonNumber, n.episodeNumber) : null;
  }, [airedRegular, watched]);

  // Open on the season of the next-up episode; if caught up, the latest season.
  const [season, setSeason] = useState<number>(() => {
    if (nextKey) return Number(nextKey.split('-')[0]);
    return regularSeasons[regularSeasons.length - 1] ?? seasons[0] ?? 1;
  });

  const seasonEpisodes = useMemo(
    () =>
      episodes
        .filter((e) => e.seasonNumber === season)
        .sort((a, b) => a.episodeNumber - b.episodeNumber),
    [episodes, season]
  );

  function isBefore(x: Episode, season: number, episode: number) {
    return x.seasonNumber < season || (x.seasonNumber === season && x.episodeNumber < episode);
  }

  function toggle(e: Episode) {
    const key = watchKey(e.seasonNumber, e.episodeNumber);
    const nowWatched = !watched.has(key);
    // Are there earlier aired episodes still unwatched? (checked before the update)
    const hasEarlierGap =
      nowWatched &&
      airedRegular.some(
        (x) =>
          isBefore(x, e.seasonNumber, e.episodeNumber) &&
          !watched.has(watchKey(x.seasonNumber, x.episodeNumber))
      );
    setWatched((prev) => {
      const copy = new Set(prev);
      if (nowWatched) copy.add(key);
      else copy.delete(key);
      return copy;
    });
    startTransition(async () => {
      if (nowWatched) await markWatched(show.tmdbId, e.seasonNumber, e.episodeNumber);
      else await markUnwatched(show.tmdbId, e.seasonNumber, e.episodeNumber);
    });
    // Watching a show moves it off the watchlist (a DB trigger does this server-side).
    if (nowWatched && isWatchlist) setIsWatchlist(false);
    if (hasEarlierGap && !neverAsk) setPrompt({ season: e.seasonNumber, episode: e.episodeNumber });
  }

  function toggleWatchlist() {
    const next = !isWatchlist;
    setIsWatchlist(next);
    startTransition(async () => {
      await setWatchlist(show.tmdbId, next);
    });
  }

  function confirmMarkPrevious() {
    if (!prompt) return;
    const { season, episode } = prompt;
    const toMark = airedRegular.filter(
      (x) =>
        isBefore(x, season, episode) || (x.seasonNumber === season && x.episodeNumber === episode)
    );
    setWatched((prev) => {
      const copy = new Set(prev);
      for (const x of toMark) copy.add(watchKey(x.seasonNumber, x.episodeNumber));
      return copy;
    });
    const payload = toMark.map((x) => ({ season: x.seasonNumber, episode: x.episodeNumber }));
    startTransition(async () => {
      await markWatchedMany(show.tmdbId, payload);
    });
    setPrompt(null);
  }

  function neverForShow() {
    try {
      localStorage.setItem('tv:neverMarkPrev:' + show.tmdbId, '1');
    } catch {
      // ignore
    }
    setNeverAsk(true);
    setPrompt(null);
  }

  function markSeason() {
    setWatched((prev) => {
      const copy = new Set(prev);
      for (const e of seasonEpisodes)
        if (hasAired(e)) copy.add(watchKey(e.seasonNumber, e.episodeNumber));
      return copy;
    });
    startTransition(async () => {
      await markSeasonWatched(show.tmdbId, season);
    });
  }

  function toggleArchive() {
    const next = !isArchived;
    setIsArchived(next);
    startTransition(async () => {
      await setArchived(show.tmdbId, next);
    });
  }

  const backdrop = imageUrl(show.backdropPath, 'w780');
  const seasonAllWatched = seasonEpisodes
    .filter(hasAired)
    .every((e) => watched.has(watchKey(e.seasonNumber, e.episodeNumber)));

  return (
    <div>
      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-card bg-ink/5">
        <div className="relative aspect-[16/7] w-full">
          {backdrop ? (
            <Image src={backdrop} alt="" fill sizes="900px" className="object-cover" priority />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h1 className="font-display text-2xl font-semibold tracking-tightest-2 text-white sm:text-3xl">
            {show.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/80">
            {show.status ? <span>{show.status}</span> : null}
            {show.firstAirDate ? (
              <span className="font-mono-tab">{show.firstAirDate.slice(0, 4)}</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Progress + actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono-tab text-sm">
            {airedWatched}/{airedRegular.length}
          </span>
          <span className="h-1.5 w-40 overflow-hidden rounded-full bg-hairline">
            <span className="block h-full rounded-full bg-income" style={{ width: `${pct}%` }} />
          </span>
          <span className="text-xs text-muted">{pct}%</span>
        </div>
        <div className="flex items-center gap-2">
          {isFollowed ? (
            <>
              <button
                onClick={toggleWatchlist}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  isWatchlist
                    ? 'bg-savings text-white'
                    : 'border border-hairline bg-card text-muted hover:text-ink'
                }`}
              >
                <Bookmark
                  size={13}
                  strokeWidth={2.2}
                  fill={isWatchlist ? 'currentColor' : 'none'}
                />
                {isWatchlist ? 'Watchlist' : 'Watch later'}
              </button>
              <button
                onClick={toggleArchive}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                  isArchived
                    ? 'bg-ink text-cream'
                    : 'border border-hairline bg-card text-muted hover:text-ink'
                }`}
              >
                <Archive size={13} strokeWidth={2.2} />
                {isArchived ? 'Archived' : 'Archive'}
              </button>
            </>
          ) : null}
          <FollowButton tmdbId={show.tmdbId} initialFollowed={isFollowed} />
        </div>
      </div>

      {/* Season selector */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {seasons.map((s) => (
            <button
              key={s}
              onClick={() => setSeason(s)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                s === season ? 'bg-ink text-cream' : 'text-muted hover:text-ink'
              }`}
            >
              {s === 0 ? 'Specials' : `Season ${s}`}
            </button>
          ))}
        </div>
        {!seasonAllWatched && seasonEpisodes.some(hasAired) ? (
          <button
            onClick={markSeason}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-hairline bg-card px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted transition-colors hover:border-income hover:text-income"
          >
            <CheckCheck size={13} strokeWidth={2.2} /> Mark season
          </button>
        ) : null}
      </div>

      {/* Episode list */}
      <div className="space-y-1.5">
        {seasonEpisodes.map((e) => {
          const key = watchKey(e.seasonNumber, e.episodeNumber);
          const isWatched = watched.has(key);
          const aired = hasAired(e);
          const isNext = key === nextKey;
          const still = imageUrl(e.stillPath, 'w300');
          return (
            <div
              key={e.tmdbId}
              className={`card flex items-center gap-3 border p-2.5 transition-colors ${
                isNext ? 'border-income/50 bg-income/5' : 'border-hairline'
              } ${isWatched ? 'opacity-60' : ''}`}
            >
              <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-cream">
                {still ? (
                  <Image src={still} alt="" fill sizes="96px" className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono-tab text-[11px] text-muted">
                    {episodeCode(e.seasonNumber, e.episodeNumber)}
                  </span>
                  {isNext ? <span className="label-tag text-income">Next up</span> : null}
                </div>
                <div className="truncate text-sm text-ink">{e.name ?? '—'}</div>
                <div className="mt-0.5 text-[11px] text-muted">
                  {aired
                    ? formatAirDate(e.airDate)
                    : e.airDate
                      ? `Airs ${formatAirDate(e.airDate)}`
                      : 'TBA'}
                </div>
              </div>
              <button
                onClick={() => toggle(e)}
                disabled={!aired && !isWatched}
                aria-label={isWatched ? 'Mark unwatched' : 'Mark watched'}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-30 ${
                  isWatched
                    ? 'border-income bg-income text-white'
                    : 'border-hairline bg-card text-muted hover:border-income hover:text-income'
                }`}
              >
                <Check size={16} strokeWidth={2.6} />
              </button>
            </div>
          );
        })}
      </div>

      {prompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPrompt(null)} />
          <div className="card relative z-10 w-full max-w-xs overflow-hidden border border-hairline text-center">
            <div className="p-5">
              <h3 className="font-display text-lg font-semibold tracking-tightest-2">
                Mark previous episodes?
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Do you want to mark all previous episodes as watched?
              </p>
            </div>
            <button
              onClick={confirmMarkPrevious}
              className="w-full border-t border-hairline py-3.5 text-sm font-semibold text-income transition-colors hover:bg-income/5"
            >
              Yes
            </button>
            <button
              onClick={() => setPrompt(null)}
              className="w-full border-t border-hairline py-3.5 text-sm text-ink transition-colors hover:bg-ink/5"
            >
              No
            </button>
            <button
              onClick={neverForShow}
              className="w-full border-t border-hairline py-3 text-xs text-muted transition-colors hover:bg-ink/5"
            >
              Never for this show
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
