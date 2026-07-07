/**
 * One-time importer for a TV Time GDPR export.
 *
 *   npx tsx scripts/import-tvtime.ts [path-to-tracking-prod-records-v2.csv]
 *
 * The real watch history lives in tracking-prod-records-v2.csv, a DynamoDB-style
 * dump keyed by a `key` column:
 *   - watch-episode-*  one row per watched episode  (the history)
 *   - user-series-*    one row per followed show     (follow / archive state)
 *
 * TV Time's `s_id` is a TheTVDB series id, so shows resolve straight to TMDB via
 * /find?external_source=tvdb_id — no fuzzy matching for the vast majority.
 *
 * Idempotent: re-running upserts and dedups against the unique constraints.
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createAdminClient } from '../lib/supabase/admin';
import { cacheShow } from '../lib/tv/cache';
import { findByTvdbId, searchTv } from '../lib/tv/tmdb';

// Env is read lazily (at call time) by the modules above, so loading it here —
// before main() runs — is sufficient even though imports are hoisted.
process.loadEnvFile(join(process.cwd(), '.env.local'));

const DEFAULT_CSV = join(homedir(), 'Downloads', 'gdpr-data', 'tracking-prod-records-v2.csv');
const CSV_PATH = process.argv[2] ?? DEFAULT_CSV;
const SHOW_CONCURRENCY = 4;

// ── Minimal RFC-4180 CSV parser (handles quotes, commas, newlines in fields) ──
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      record.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      record.push(field);
      field = '';
      if (record.length > 1 || record[0] !== '') rows.push(record);
      record = [];
    } else field += c;
  }
  if (field !== '' || record.length) {
    record.push(field);
    rows.push(record);
  }
  const header = rows.shift()!;
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

const isTrue = (v: string | undefined) => (v ?? '').trim().toLowerCase() === 'true';
const toIso = (v: string | undefined) => {
  const s = (v ?? '').trim();
  return s ? s.replace(' ', 'T') + 'Z' : null;
};

type WatchRow = { season: number; episode: number; watchedAt: string | null };

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await fn(items[i]!, i);
      }
    })
  );
  return results;
}

async function main() {
  console.log(`Reading ${CSV_PATH}`);
  const records = parseCsv(readFileSync(CSV_PATH, 'utf8'));

  // Follow / archive state, keyed by TV Time s_id.
  const follows = new Map<string, { followed: boolean; archived: boolean; name: string }>();
  // Watch history grouped by s_id.
  const watchesBySid = new Map<string, WatchRow[]>();
  const nameBySid = new Map<string, string>();

  for (const r of records) {
    const key = r.key ?? '';
    const sid = r.s_id?.trim();
    if (!sid) continue;

    if (key.startsWith('user-series-')) {
      follows.set(sid, {
        followed: isTrue(r.is_followed),
        archived: isTrue(r.is_archived),
        name: r.series_name?.trim() || '',
      });
      if (r.series_name?.trim()) nameBySid.set(sid, r.series_name.trim());
    } else if (key.startsWith('watch-episode-')) {
      const season = Number(r.s_no);
      const episode = Number(r.ep_no);
      if (!Number.isInteger(season) || !Number.isInteger(episode)) continue;
      const list = watchesBySid.get(sid) ?? [];
      list.push({ season, episode, watchedAt: toIso(r.created_at) });
      watchesBySid.set(sid, list);
      if (r.series_name?.trim()) nameBySid.set(sid, r.series_name.trim());
    }
  }

  // Import every show that has watch history or is followed.
  let sids = [...new Set([...watchesBySid.keys(), ...follows.keys()])];
  if (process.env.IMPORT_LIMIT) sids = sids.slice(0, Number(process.env.IMPORT_LIMIT));
  const totalWatches = [...watchesBySid.values()].reduce((n, w) => n + w.length, 0);
  console.log(
    `Parsed ${records.length} rows → ${sids.length} shows, ${totalWatches} watched episodes.\n`
  );

  const db = createAdminClient();
  let matched = 0;
  let fuzzy = 0;
  let watchesInserted = 0;
  const unmatched: { sid: string; name: string }[] = [];

  await mapLimit(sids, SHOW_CONCURRENCY, async (sid) => {
    const name = nameBySid.get(sid) ?? follows.get(sid)?.name ?? '';

    // 1 — resolve to a TMDB id (TheTVDB id first, then a name search).
    let tmdbId: number | null = null;
    let viaFuzzy = false;
    try {
      const byTvdb = await findByTvdbId(Number(sid));
      if (byTvdb) tmdbId = byTvdb.id;
      else if (name) {
        const { results } = await searchTv(name);
        if (results[0]) {
          tmdbId = results[0].id;
          viaFuzzy = true;
        }
      }
    } catch (e) {
      console.warn(`  ! resolve failed for ${name || sid}: ${(e as Error).message}`);
    }

    if (!tmdbId) {
      unmatched.push({ sid, name });
      console.log(`  ✗ unmatched: ${name || `s_id ${sid}`}`);
      return;
    }
    matched++;
    if (viaFuzzy) {
      fuzzy++;
      console.log(`  ~ fuzzy: "${name}" → tmdb ${tmdbId}`);
    }

    // 2 — cache show + all seasons.
    try {
      await cacheShow(db, tmdbId);
    } catch (e) {
      console.warn(`  ! cache failed for ${name} (tmdb ${tmdbId}): ${(e as Error).message}`);
      return;
    }

    // 3 — follow state: active only if currently followed & not archived on TV
    //     Time; everything else archived so history is kept but Up Next stays clean.
    const f = follows.get(sid);
    const archived = !(f?.followed === true && f?.archived !== true);
    await db
      .from('tv_follows')
      .upsert({ show_tmdb_id: tmdbId, archived }, { onConflict: 'show_tmdb_id' });

    // 4 — watches (dedup on the unique constraint).
    const watchRows = (watchesBySid.get(sid) ?? []).map((w) => ({
      show_tmdb_id: tmdbId!,
      season_number: w.season,
      episode_number: w.episode,
      ...(w.watchedAt ? { watched_at: w.watchedAt } : {}),
    }));
    for (let i = 0; i < watchRows.length; i += 500) {
      const { error } = await db.from('tv_watches').upsert(watchRows.slice(i, i + 500), {
        onConflict: 'show_tmdb_id,season_number,episode_number',
        ignoreDuplicates: true,
      });
      if (error) console.warn(`  ! watches failed for ${name}: ${error.message}`);
    }
    watchesInserted += watchRows.length;
    console.log(`  ✓ ${name} — ${watchRows.length} watches${archived ? ' (archived)' : ''}`);
  });

  console.log('\n── Summary ─────────────────────────────');
  console.log(`Shows matched:      ${matched} (${fuzzy} via name search)`);
  console.log(`Shows unmatched:    ${unmatched.length}`);
  console.log(`Watches processed:  ${watchesInserted}`);
  if (unmatched.length) {
    console.log('\nUnmatched (resolve these manually via Search):');
    for (const u of unmatched) console.log(`  - ${u.name || '(no name)'}  [s_id ${u.sid}]`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
