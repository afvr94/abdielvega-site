import Link from 'next/link';
import type { UpcomingEpisode, UpNextItem } from '@/lib/tv/types';
import { dayHeading, episodeCode, humanizeMinutes } from '@/lib/tv/format';
import { ProgressRing } from './ProgressRing';

const TONIGHT_SHOWN = 3;

export function UpNextSummary({
  behind,
  thisWeek,
  behindMinutes,
  today,
}: {
  behind: UpNextItem[];
  thisWeek: UpcomingEpisode[];
  behindMinutes: number;
  today: string;
}) {
  const tonight = thisWeek.filter((u) => u.episode.airDate === today);
  const nextUp = thisWeek.find((u) => (u.episode.airDate ?? '') > today);

  const aired = behind.reduce((n, i) => n + i.airedTotal, 0);
  const left = behind.reduce((n, i) => n + i.airedTotal - i.airedWatched, 0);
  const pct = aired ? Math.round(((aired - left) / aired) * 100) : 100;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        href="/calendar"
        className="min-w-0 card border border-hairline p-3.5 transition-colors hover:border-ink/25"
      >
        {tonight.length > 0 ? (
          <>
            <div className="label-tag text-income">Tonight</div>
            <ul className="mt-2 space-y-0.5 text-sm">
              {tonight.slice(0, TONIGHT_SHOWN).map(({ show, episode }) => (
                <li key={episode.tmdbId} className="truncate">
                  {show.name}{' '}
                  <span className="font-mono-tab text-[11px] text-muted">
                    {episodeCode(episode.seasonNumber, episode.episodeNumber)}
                  </span>
                </li>
              ))}
              {tonight.length > TONIGHT_SHOWN ? (
                <li className="text-xs text-muted">+{tonight.length - TONIGHT_SHOWN} more</li>
              ) : null}
            </ul>
          </>
        ) : (
          <>
            <div className="label-tag text-income">Next up</div>
            {nextUp ? (
              <div className="mt-2 text-sm">
                <div className="truncate">{nextUp.show.name}</div>
                <div className="text-xs text-muted">{dayHeading(nextUp.episode.airDate ?? '')}</div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-muted">Nothing this week</div>
            )}
          </>
        )}
      </Link>

      <a
        href="#up-next"
        className="flex min-w-0 items-center gap-3 card border border-hairline p-3.5 transition-colors hover:border-ink/25"
      >
        <ProgressRing pct={pct}>{pct}%</ProgressRing>
        <div className="min-w-0">
          <div className="label-tag text-savings">Behind</div>
          <div className="font-display text-2xl leading-tight font-semibold">
            {left.toLocaleString('en-US')}
          </div>
          <div className="text-[11px] leading-tight text-muted">
            eps left
            <br />
            {humanizeMinutes(behindMinutes)}
          </div>
        </div>
      </a>
    </div>
  );
}
