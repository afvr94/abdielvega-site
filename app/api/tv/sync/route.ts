import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cacheShow } from '@/lib/tv/cache';
import { buildNotificationEmail, type NotifyItem } from '@/lib/tv/notify';
import { sendMail } from '@/lib/mail';

type PendingRow = {
  episode_tmdb_id: number;
  show_name: string;
  season_number: number;
  episode_number: number;
  name: string | null;
  air_date: string | null;
};

// After syncing, email a digest of newly-aired episodes not yet notified.
async function notifyNewEpisodes(
  db: ReturnType<typeof createAdminClient>
): Promise<{ notified: number; error?: string }> {
  const to = process.env.TV_NOTIFY_EMAIL || process.env.CONTACT_INBOX || process.env.EMAIL;
  if (!to) return { notified: 0 };

  const { data, error } = await db.rpc('tv_pending_notifications');
  if (error) return { notified: 0, error: `pending: ${error.message}` };
  const rows = (data ?? []) as PendingRow[];
  if (rows.length === 0) return { notified: 0 };

  const items: NotifyItem[] = rows.map((r) => ({
    showName: r.show_name,
    seasonNumber: r.season_number,
    episodeNumber: r.episode_number,
    name: r.name,
    airDate: r.air_date,
  }));

  try {
    await sendMail({ to, ...buildNotificationEmail(items) });
  } catch (e) {
    return { notified: 0, error: `send: ${e instanceof Error ? e.message : String(e)}` };
  }

  // Only mark notified once the email actually went out.
  const { error: insErr } = await db.from('tv_notified').upsert(
    rows.map((r) => ({ episode_tmdb_id: r.episode_tmdb_id })),
    { onConflict: 'episode_tmdb_id', ignoreDuplicates: true }
  );
  if (insErr) return { notified: rows.length, error: `mark: ${insErr.message}` };
  return { notified: rows.length };
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Statuses that mean the show won't gain new episodes — skip to save TMDB quota.
const DONE_STATUSES = new Set(['Ended', 'Canceled']);
const CONCURRENCY = 4;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();

  const { data: follows, error } = await db
    .from('tv_follows')
    .select('show_tmdb_id')
    .eq('archived', false);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const followedIds = (follows ?? []).map((f: { show_tmdb_id: number }) => f.show_tmdb_id);
  if (followedIds.length === 0) {
    return NextResponse.json({ ok: true, candidates: 0, synced: 0, failures: [] });
  }

  const { data: showRows, error: showErr } = await db
    .from('tv_shows')
    .select('tmdb_id, status')
    .in('tmdb_id', followedIds);
  if (showErr) {
    return NextResponse.json({ error: showErr.message }, { status: 500 });
  }

  // Skip shows that won't gain episodes; a null status (uncached) still syncs.
  const targets = (showRows ?? [])
    .filter((s: { status: string | null }) => s.status === null || !DONE_STATUSES.has(s.status))
    .map((s: { tmdb_id: number }) => s.tmdb_id);

  let synced = 0;
  const failures: { tmdbId: number; error: string }[] = [];

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (tmdbId) => {
        try {
          await cacheShow(db, tmdbId);
          synced += 1;
        } catch (e) {
          failures.push({ tmdbId, error: e instanceof Error ? e.message : String(e) });
        }
      })
    );
  }

  const notify = await notifyNewEpisodes(db);
  if (notify.error) failures.push({ tmdbId: -1, error: notify.error });

  return NextResponse.json({
    ok: true,
    candidates: targets.length,
    synced,
    notified: notify.notified,
    failures,
  });
}
