import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cacheShow } from '@/lib/tv/cache';

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

  return NextResponse.json({
    ok: true,
    candidates: targets.length,
    synced,
    failures,
  });
}
