import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getStats } from '@/lib/tv/queries';
import type { Stats } from '@/lib/tv/types';
import { formatAirDate, humanizeMinutes, daysFromMinutes } from '@/lib/tv/format';

export const metadata = { title: 'Stats' };

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card border border-hairline p-4">
      <div className="label-tag mb-1.5">{label}</div>
      <div className="font-mono-tab text-2xl font-semibold tracking-tightest-2 sm:text-3xl">
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-xs text-muted">{sub}</div> : null}
    </div>
  );
}

export default async function StatsPage() {
  const db = await createClient();
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

  const maxYear = Math.max(1, ...stats.byYear.map((y) => y.count));
  const maxTop = Math.max(1, ...stats.topShows.map((s) => s.count));

  return (
    <div className="space-y-9">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tightest-3">Stats</h1>
        {stats.firstWatch && stats.lastWatch ? (
          <span className="label-tag">
            {formatAirDate(stats.firstWatch.slice(0, 10))} —{' '}
            {formatAirDate(stats.lastWatch.slice(0, 10))}
          </span>
        ) : null}
      </div>

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

      {stats.byYear.length > 0 ? (
        <section>
          <div className="label-tag mb-3">Episodes by year</div>
          <div className="space-y-1.5">
            {stats.byYear.map((y) => (
              <div key={y.year} className="flex items-center gap-3">
                <span className="font-mono-tab w-10 shrink-0 text-xs text-muted">{y.year}</span>
                <span className="h-4 flex-1 overflow-hidden rounded bg-hairline">
                  <span
                    className="block h-full rounded bg-income"
                    style={{ width: `${(y.count / maxYear) * 100}%` }}
                  />
                </span>
                <span className="font-mono-tab w-12 shrink-0 text-right text-xs">{y.count}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {stats.topShows.length > 0 ? (
        <section>
          <div className="label-tag mb-3">Most watched</div>
          <div className="space-y-1.5">
            {stats.topShows.map((s, i) => (
              <Link
                key={s.showTmdbId}
                href={`/show/${s.showTmdbId}`}
                className="card flex items-center gap-3 border border-hairline p-2.5 transition-colors hover:border-ink/25"
              >
                <span className="font-mono-tab w-5 shrink-0 text-xs text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display font-semibold leading-tight">{s.name}</div>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-hairline">
                    <span
                      className="block h-full rounded-full bg-ink/50"
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
