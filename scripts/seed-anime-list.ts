/**
 * One-time: create an "Anime" list and add every followed show that TMDB
 * classifies as Animation + Japanese origin.
 *
 *   npx tsx scripts/seed-anime-list.ts
 *
 * Idempotent — safe to re-run (dedupes on the list membership PK). Requires the
 * tv_lists / tv_list_shows tables (see DEPLOY.md). Uses the service-role key.
 */
import { join } from 'node:path';
import { createAdminClient } from '../lib/supabase/admin';

process.loadEnvFile(join(process.cwd(), '.env.local'));

const TOKEN = process.env.TMDB_ACCESS_TOKEN;
if (!TOKEN) throw new Error('TMDB_ACCESS_TOKEN missing');
const ANIMATION_GENRE = 16;

async function tmdb(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.themoviedb.org/3${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`TMDB ${path} → ${res.status}`);
  return res.json();
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]!);
      }
    })
  );
  return out;
}

async function main() {
  const db = createAdminClient();
  const { data: follows, error } = await db.from('tv_follows').select('show_tmdb_id');
  if (error) throw error;
  const ids = (follows ?? []).map((f: { show_tmdb_id: number }) => f.show_tmdb_id);
  console.log(`Checking ${ids.length} followed shows against TMDB…`);

  const flagged = await mapLimit(ids, 6, async (id) => {
    try {
      const show = await tmdb(`/tv/${id}`);
      const genres = (show.genres as { id: number }[] | undefined) ?? [];
      const lang = show.original_language as string | undefined;
      const origin = (show.origin_country as string[] | undefined) ?? [];
      const isAnime =
        genres.some((g) => g.id === ANIMATION_GENRE) && (lang === 'ja' || origin.includes('JP'));
      return isAnime ? { id, name: show.name as string } : null;
    } catch {
      return null;
    }
  });
  const anime = flagged.filter((x): x is { id: number; name: string } => x !== null);
  console.log(`Detected ${anime.length} anime: ${anime.map((a) => a.name).join(', ')}`);
  if (anime.length === 0) return;

  // Find or create the "Anime" list.
  const existing = await db.from('tv_lists').select('id').ilike('name', 'anime').maybeSingle();
  let listId = (existing.data as { id: number } | null)?.id;
  if (!listId) {
    const created = await db.from('tv_lists').insert({ name: 'Anime' }).select('id').single();
    if (created.error) throw created.error;
    listId = (created.data as { id: number }).id;
  }

  const { error: insErr } = await db.from('tv_list_shows').upsert(
    anime.map((a) => ({ list_id: listId, show_tmdb_id: a.id })),
    { onConflict: 'list_id,show_tmdb_id', ignoreDuplicates: true }
  );
  if (insErr) throw insErr;
  console.log(`Anime list ready with ${anime.length} shows.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
