'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { cacheProviders, cacheShow } from '@/lib/tv/cache';
import { getFollowedTmdbIds } from '@/lib/tv/queries';
import { searchTv, imageUrl, getEpisodeScore, type Score } from '@/lib/tv/tmdb';
import { todayIso } from '@/lib/tv/format';

export type SearchHit = {
  tmdbId: number;
  name: string;
  year: string | null;
  overview: string | null;
  posterUrl: string | null;
  isFollowed: boolean;
};

export async function searchShows(query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const db = await createClient();
  const [{ results }, followed] = await Promise.all([searchTv(q), getFollowedTmdbIds(db)]);
  return results.slice(0, 20).map((r) => ({
    tmdbId: r.id,
    name: r.name,
    year: r.first_air_date ? r.first_air_date.slice(0, 4) : null,
    overview: r.overview,
    posterUrl: imageUrl(r.poster_path, 'w185'),
    isFollowed: followed.has(r.id),
  }));
}

export async function followShow(tmdbId: number): Promise<void> {
  const db = await createClient();
  await cacheShow(db, tmdbId);
  const [{ error }] = await Promise.all([
    db
      .from('tv_follows')
      .upsert({ show_tmdb_id: tmdbId }, { onConflict: 'show_tmdb_id', ignoreDuplicates: true }),
    // The daily sync fills providers too, so a TMDB hiccup here shouldn't fail the follow.
    cacheProviders(db, tmdbId).catch(() => {}),
  ]);
  if (error) throw error;
  revalidatePath('/tv');
  revalidatePath(`/tv/show/${tmdbId}`);
}

export async function unfollowShow(tmdbId: number): Promise<void> {
  const db = await createClient();
  const { error } = await db.from('tv_follows').delete().eq('show_tmdb_id', tmdbId);
  if (error) throw error;
  revalidatePath('/tv');
  revalidatePath(`/tv/show/${tmdbId}`);
}

export async function setArchived(tmdbId: number, archived: boolean): Promise<void> {
  const db = await createClient();
  const { error } = await db.from('tv_follows').update({ archived }).eq('show_tmdb_id', tmdbId);
  if (error) throw error;
  revalidatePath('/tv');
  revalidatePath(`/tv/show/${tmdbId}`);
}

export async function archiveShows(tmdbIds: number[]): Promise<void> {
  if (!tmdbIds.every((id) => Number.isInteger(id) && id > 0)) throw new Error('Invalid show ids');
  if (tmdbIds.length === 0) return;
  const db = await createClient();
  const { error } = await db
    .from('tv_follows')
    .update({ archived: true })
    .in('show_tmdb_id', tmdbIds);
  if (error) throw error;
  revalidatePath('/tv');
  revalidatePath('/tv/shows');
  revalidatePath('/tv/show/[tmdbId]', 'page');
}

export async function setServices(providerIds: number[]): Promise<void> {
  if (!Array.isArray(providerIds) || !providerIds.every((id) => Number.isInteger(id) && id > 0)) {
    throw new Error('Invalid provider ids');
  }
  const db = await createClient();
  const { error } = await db
    .from('tv_settings')
    .upsert({ id: true, services: [...new Set(providerIds)] });
  if (error) throw error;
  revalidatePath('/tv');
  revalidatePath('/tv/calendar');
  revalidatePath('/tv/services');
}

// Toggle a followed show's watchlist flag (kept out of Up Next while true).
export async function setWatchlist(tmdbId: number, watchlist: boolean): Promise<void> {
  const db = await createClient();
  const { error } = await db.from('tv_follows').update({ watchlist }).eq('show_tmdb_id', tmdbId);
  if (error) throw error;
  revalidatePath('/tv');
  revalidatePath(`/tv/show/${tmdbId}`);
}

// ── Custom lists ─────────────────────────────────────────────────────────────

export async function createList(name: string): Promise<number | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const db = await createClient();
  const { data, error } = await db.from('tv_lists').insert({ name: trimmed }).select('id').single();
  if (error) throw error;
  revalidatePath('/tv/shows');
  return data.id;
}

export async function deleteList(listId: number): Promise<void> {
  const db = await createClient();
  const { error } = await db.from('tv_lists').delete().eq('id', listId);
  if (error) throw error;
  revalidatePath('/tv/shows');
}

export async function addShowToList(listId: number, tmdbId: number): Promise<void> {
  const db = await createClient();
  const { error } = await db
    .from('tv_list_shows')
    .upsert(
      { list_id: listId, show_tmdb_id: tmdbId },
      { onConflict: 'list_id,show_tmdb_id', ignoreDuplicates: true }
    );
  if (error) throw error;
  revalidatePath('/tv/shows');
  revalidatePath(`/tv/show/${tmdbId}`);
}

export async function removeShowFromList(listId: number, tmdbId: number): Promise<void> {
  const db = await createClient();
  const { error } = await db
    .from('tv_list_shows')
    .delete()
    .eq('list_id', listId)
    .eq('show_tmdb_id', tmdbId);
  if (error) throw error;
  revalidatePath('/tv/shows');
  revalidatePath(`/tv/show/${tmdbId}`);
}

// Create a list and immediately add a show to it.
export async function createListWithShow(name: string, tmdbId: number): Promise<void> {
  const listId = await createList(name);
  if (listId != null) await addShowToList(listId, tmdbId);
}

// "Want to watch": cache the show and follow it straight onto the watchlist.
export async function addToWatchlist(tmdbId: number): Promise<void> {
  const db = await createClient();
  await cacheShow(db, tmdbId);
  const { error } = await db
    .from('tv_follows')
    .upsert({ show_tmdb_id: tmdbId, watchlist: true }, { onConflict: 'show_tmdb_id' });
  if (error) throw error;
  revalidatePath('/tv');
  revalidatePath(`/tv/show/${tmdbId}`);
}

export type EpisodeSheetData = {
  overview: string | null;
  runtime: number | null;
  watchedAt: string | null;
  score: Score | null;
};

export async function getEpisodeSheet(
  tmdbId: number,
  season: number,
  episode: number
): Promise<EpisodeSheetData> {
  if (![tmdbId, season, episode].every(Number.isInteger)) throw new Error('Invalid episode');
  const db = await createClient();
  const [ep, watch, score] = await Promise.all([
    db
      .from('tv_episodes')
      .select('overview,runtime')
      .eq('show_tmdb_id', tmdbId)
      .eq('season_number', season)
      .eq('episode_number', episode)
      .maybeSingle(),
    db
      .from('tv_watches')
      .select('watched_at')
      .eq('show_tmdb_id', tmdbId)
      .eq('season_number', season)
      .eq('episode_number', episode)
      .maybeSingle(),
    getEpisodeScore(tmdbId, season, episode).catch(() => null),
  ]);
  if (ep.error) throw ep.error;
  if (watch.error) throw watch.error;
  const row = ep.data;
  return {
    overview: row?.overview ?? null,
    runtime: row?.runtime ?? null,
    watchedAt: watch.data?.watched_at ?? null,
    score,
  };
}

export async function markWatched(tmdbId: number, season: number, episode: number): Promise<void> {
  const db = await createClient();
  const { error } = await db
    .from('tv_watches')
    .upsert(
      { show_tmdb_id: tmdbId, season_number: season, episode_number: episode },
      { onConflict: 'show_tmdb_id,season_number,episode_number', ignoreDuplicates: true }
    );
  if (error) throw error;
  // The show page updates optimistically; re-rendering it per tap re-runs its whole query.
  revalidatePath('/tv');
}

export async function markUnwatched(
  tmdbId: number,
  season: number,
  episode: number
): Promise<void> {
  const db = await createClient();
  const { error } = await db
    .from('tv_watches')
    .delete()
    .eq('show_tmdb_id', tmdbId)
    .eq('season_number', season)
    .eq('episode_number', episode);
  if (error) throw error;
  revalidatePath('/tv');
}

// Mark an explicit list of episodes watched in one batch. The caller already
// knows exactly which (season, episode) pairs to mark, so no server-side lookup.
export async function markWatchedMany(
  tmdbId: number,
  episodes: { season: number; episode: number }[]
): Promise<void> {
  if (episodes.length === 0) return;
  const db = await createClient();
  const rows = episodes.map((e) => ({
    show_tmdb_id: tmdbId,
    season_number: e.season,
    episode_number: e.episode,
  }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from('tv_watches').upsert(rows.slice(i, i + 500), {
      onConflict: 'show_tmdb_id,season_number,episode_number',
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }
  revalidatePath('/tv');
  revalidatePath(`/tv/show/${tmdbId}`);
}

// Mark every aired episode in a season watched (skips ones already logged).
export async function markSeasonWatched(tmdbId: number, season: number): Promise<void> {
  const db = await createClient();
  const today = todayIso();
  const { data, error } = await db
    .from('tv_episodes')
    .select('season_number,episode_number')
    .eq('show_tmdb_id', tmdbId)
    .eq('season_number', season)
    .not('air_date', 'is', null)
    .lte('air_date', today);
  if (error) throw error;
  const rows = (data ?? []).map((e: { season_number: number; episode_number: number }) => ({
    show_tmdb_id: tmdbId,
    season_number: e.season_number,
    episode_number: e.episode_number,
  }));
  if (rows.length) {
    const { error: insErr } = await db.from('tv_watches').upsert(rows, {
      onConflict: 'show_tmdb_id,season_number,episode_number',
      ignoreDuplicates: true,
    });
    if (insErr) throw insErr;
  }
  revalidatePath('/tv');
  revalidatePath(`/tv/show/${tmdbId}`);
}
