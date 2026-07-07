'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { cacheShow } from '@/lib/tv/cache';
import { getFollowedTmdbIds } from '@/lib/tv/queries';
import { searchTv, imageUrl } from '@/lib/tv/tmdb';

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
  const { error } = await db
    .from('tv_follows')
    .upsert({ show_tmdb_id: tmdbId }, { onConflict: 'show_tmdb_id', ignoreDuplicates: true });
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

// Toggle a followed show's watchlist flag (kept out of Up Next while true).
export async function setWatchlist(tmdbId: number, watchlist: boolean): Promise<void> {
  const db = await createClient();
  const { error } = await db.from('tv_follows').update({ watchlist }).eq('show_tmdb_id', tmdbId);
  if (error) throw error;
  revalidatePath('/tv');
  revalidatePath(`/tv/show/${tmdbId}`);
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

export async function markWatched(tmdbId: number, season: number, episode: number): Promise<void> {
  const db = await createClient();
  const { error } = await db
    .from('tv_watches')
    .upsert(
      { show_tmdb_id: tmdbId, season_number: season, episode_number: episode },
      { onConflict: 'show_tmdb_id,season_number,episode_number', ignoreDuplicates: true }
    );
  if (error) throw error;
  revalidatePath('/tv');
  revalidatePath(`/tv/show/${tmdbId}`);
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
  revalidatePath(`/tv/show/${tmdbId}`);
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
  const today = new Date().toISOString().slice(0, 10);
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
