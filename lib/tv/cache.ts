import type { SupabaseClient } from '@supabase/supabase-js';
import { getShow, getSeason, getExternalIds } from './tmdb';

// TMDB uses '' for unknown dates; Postgres `date` wants null.
function nullDate(d: string | null | undefined): string | null {
  return d && d.trim() ? d : null;
}

// Fetch a show + all its seasons from TMDB once and persist into tv_shows /
// tv_episodes. Called on follow, import, and the scheduled sync — never on read.
export async function cacheShow(db: SupabaseClient, tmdbId: number): Promise<void> {
  const show = await getShow(tmdbId);

  let tvdbId: number | null = null;
  try {
    tvdbId = (await getExternalIds(tmdbId)).tvdb_id ?? null;
  } catch {
    // external_ids is best-effort; a missing tvdb id doesn't block caching.
  }

  const { error: showErr } = await db.from('tv_shows').upsert({
    tmdb_id: show.id,
    tvdb_id: tvdbId,
    name: show.name,
    poster_path: show.poster_path,
    backdrop_path: show.backdrop_path,
    overview: show.overview,
    status: show.status,
    first_air_date: nullDate(show.first_air_date),
    last_synced_at: new Date().toISOString(),
  });
  if (showErr) throw showErr;

  const seasons = await Promise.all(
    show.seasons.map((s) => getSeason(tmdbId, s.season_number).catch(() => null))
  );

  const rows = seasons
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .flatMap((season) =>
      season.episodes.map((ep) => ({
        tmdb_id: ep.id,
        show_tmdb_id: tmdbId,
        season_number: ep.season_number,
        episode_number: ep.episode_number,
        name: ep.name,
        overview: ep.overview,
        air_date: nullDate(ep.air_date),
        still_path: ep.still_path,
        runtime: ep.runtime,
      }))
    );

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db
      .from('tv_episodes')
      .upsert(rows.slice(i, i + 500), { onConflict: 'tmdb_id' });
    if (error) throw error;
  }
}
