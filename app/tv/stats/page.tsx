import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getStats, getYear } from '@/lib/tv/queries';
import type { Stats, YearInReview } from '@/lib/tv/types';
import { YearBestEpisodes } from '@/components/tv/YearBestEpisodes';
import {
  formatAirDate,
  humanizeMinutes,
  daysFromMinutes,
  dateIso,
  todayIso,
} from '@/lib/tv/format';
import { buildHeatmap, heatLevel } from '@/lib/tv/heatmap';

export const metadata = { title: 'Stats' };

const LEVEL_BG = ['bg-ink/6', 'bg-income/30', 'bg-income/55', 'bg-income/80', 'bg-income'];

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card border border-hairline p-4">
      <div className="mb-1.5 label-tag">{label}</div>
      <div className="font-mono-tab text-2xl font-semibold tracking-tightest-2 sm:text-3xl">
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-xs text-muted">{sub}</div> : null}
    </div>
  );
}

function YearSection({
  year,
  review,
  years,
}: {
  year: number;
  review: YearInReview;
  years: number[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="shrink-0 font-display text-2xl font-semibold tracking-tightest-2">
          Your {year}
        </h2>
        {years.length > 1 ? (
          <nav aria-label="Year" className="no-scrollbar flex min-w-0 gap-1.5 overflow-x-auto">
            {years.map((y) => (
              <Link
                key={y}
                href={`/stats?year=${y}`}
                aria-current={y === year ? 'page' : undefined}
                className={`shrink-0 rounded-full px-3 py-1.5 font-mono-tab text-xs font-semibold transition-colors ${
                  y === year
                    ? 'border border-hairline bg-ink/10 text-ink'
                    : 'border border-transparent text-muted hover:text-ink'
                }`}
              >
                {y}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>

      {review.episodes === 0 ? (
        <p className="card border border-hairline p-6 text-sm text-muted">No watches in {year}.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Episodes" value={review.episodes.toLocaleString('en-US')} />
            <StatCard label="Time watched" value={humanizeMinutes(review.runtimeMin)} />
            <StatCard label="Shows" value={String(review.shows)} sub={`${review.newShows} new`} />
            {review.bingeDay ? (
              <StatCard
                label="Biggest day"
                value={`${review.bingeDay.count} eps`}
                sub={formatAirDate(review.bingeDay.date)}
              />
            ) : null}
            {review.longestStreak ? (
              <StatCard
                label="Longest streak"
                value={`${review.longestStreak.days} ${review.longestStreak.days === 1 ? 'day' : 'days'}`}
                sub={`from ${formatAirDate(review.longestStreak.start)}`}
              />
            ) : null}
          </div>

          <div>
            <div className="mb-2 label-tag">Top shows</div>
            <div className="space-y-1.5">
              {review.topShows.map((s, i) => (
                <Link
                  key={s.showTmdbId}
                  href={`/show/${s.showTmdbId}`}
                  className="flex items-center gap-3 card border border-hairline p-2.5 transition-colors hover:border-ink/25"
                >
                  <span className="w-5 shrink-0 font-mono-tab text-xs text-muted">{i + 1}</span>
                  <div className="min-w-0 flex-1 truncate font-display leading-tight font-semibold">
                    {s.name}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono-tab text-sm">{s.count} eps</div>
                    <div className="text-[11px] text-muted">{humanizeMinutes(s.runtimeMin)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <Suspense fallback={null}>
            <YearBestEpisodes year={review} />
          </Suspense>
        </>
      )}

      {review.bulk.map((b) => (
        <p key={b.date} className="text-xs text-muted">
          These stats skip {b.count.toLocaleString('en-US')} episodes bulk-imported on{' '}
          {formatAirDate(b.date)}.
        </p>
      ))}
    </section>
  );
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string | string[] }>;
}) {
  const { year: yearParam } = await searchParams;
  const today = todayIso();
  const thisYear = Number(today.slice(0, 4));
  const asked = Number(yearParam);
  const year = Number.isInteger(asked) && asked >= 1900 && asked <= thisYear ? asked : thisYear;
  const db = await createClient();
  // Started before getStats so both reads run at once. The year section is optional;
  // without tv_year() applied the rest of Stats still renders.
  const reviewPromise = getYear(db, year).catch(() => null);
  let stats: Stats;
  try {
    stats = await getStats(db);
  } catch {
    return (
      <div className="py-20 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tightest-3">Stats</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Stats aren&apos;t available yet — run the{' '}
          <span className="font-mono-tab">tv_stats()</span> function from{' '}
          <span className="font-mono-tab">DEPLOY.md</span> in Supabase, then refresh.
        </p>
      </div>
    );
  }

  const years = [...new Set([thisYear, year, ...stats.byYear.map((y) => y.year)])].sort(
    (a, b) => b - a
  );
  const review = await reviewPromise;

  const maxYear = Math.max(1, ...stats.byYear.map((y) => y.count));
  const maxTop = Math.max(1, ...stats.topShows.map((s) => s.count));
  const heat = buildHeatmap(stats.byDay, today, 53);

  return (
    <div className="space-y-9">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tightest-3">Stats</h1>
        {stats.firstWatch && stats.lastWatch ? (
          <span className="label-tag">
            {formatAirDate(dateIso(new Date(stats.firstWatch)))} —{' '}
            {formatAirDate(dateIso(new Date(stats.lastWatch)))}
          </span>
        ) : null}
      </div>

      {review ? <YearSection year={year} review={review} years={years} /> : null}

      <section>
        <div className="mb-3 label-tag">All time</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Episodes watched" value={stats.totalWatches.toLocaleString('en-US')} />
          <StatCard
            label="Time watched"
            value={humanizeMinutes(stats.totalRuntimeMin)}
            sub={`≈ ${daysFromMinutes(stats.totalRuntimeMin)} nonstop`}
          />
          <StatCard
            label="Shows tracked"
            value={(stats.showsFollowed + stats.showsArchived).toLocaleString('en-US')}
            sub={`${stats.showsArchived} archived`}
          />
        </div>
      </section>

      {stats.byDay.length > 0 ? (
        <section>
          <div className="mb-3 label-tag">Activity · last year</div>
          <div className="no-scrollbar overflow-x-auto pb-1">
            <div>
              <div className="mb-1 flex gap-[3px] text-[9px] text-muted">
                {heat.columns.map((_, w) => {
                  const label = heat.months.find((m) => m.col === w)?.label;
                  return (
                    <span key={w} className="w-[11px] shrink-0">
                      {label ?? ''}
                    </span>
                  );
                })}
              </div>
              <div className="flex gap-[3px]">
                {heat.columns.map((col, w) => (
                  <div key={w} className="flex shrink-0 flex-col gap-[3px]">
                    {col.map((cell, d) => (
                      <span
                        key={d}
                        title={cell ? `${cell.date} · ${cell.count}` : undefined}
                        className={`h-[11px] w-[11px] rounded-[2px] ${cell ? LEVEL_BG[heatLevel(cell.count)] : ''}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted">
                Less
                {LEVEL_BG.map((bg, i) => (
                  <span key={i} className={`h-[10px] w-[10px] rounded-[2px] ${bg}`} />
                ))}
                More
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {stats.byYear.length > 0 ? (
        <section>
          <div className="mb-3 label-tag">Episodes by year</div>
          <div className="space-y-1.5">
            {stats.byYear.map((y) => (
              <div key={y.year} className="flex items-center gap-3">
                <span className="w-10 shrink-0 font-mono-tab text-xs text-muted">{y.year}</span>
                <span className="h-4 flex-1 overflow-hidden rounded-sm bg-hairline">
                  <span
                    className="block h-full rounded-sm bg-income"
                    style={{ width: `${(y.count / maxYear) * 100}%` }}
                  />
                </span>
                <span className="w-12 shrink-0 text-right font-mono-tab text-xs">{y.count}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {stats.topShows.length > 0 ? (
        <section>
          <div className="mb-3 label-tag">Most watched</div>
          <div className="space-y-1.5">
            {stats.topShows.map((s, i) => (
              <Link
                key={s.showTmdbId}
                href={`/show/${s.showTmdbId}`}
                className="flex items-center gap-3 card border border-hairline p-2.5 transition-colors hover:border-ink/25"
              >
                <span className="w-5 shrink-0 font-mono-tab text-xs text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display leading-tight font-semibold">{s.name}</div>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-hairline">
                    <span
                      className="block h-full rounded-full bg-income"
                      style={{ width: `${(s.count / maxTop) * 100}%` }}
                    />
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono-tab text-sm">{s.count} eps</div>
                  <div className="text-[11px] text-muted">{humanizeMinutes(s.runtimeMin)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
