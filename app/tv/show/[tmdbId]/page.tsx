import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { getShowDetail } from '@/lib/tv/queries';
import { getShow, imageUrl } from '@/lib/tv/tmdb';
import { ShowDetailClient } from '@/components/tv/ShowDetailClient';
import { FollowButton } from '@/components/tv/FollowButton';

export default async function ShowPage({ params }: { params: Promise<{ tmdbId: string }> }) {
  const { tmdbId: raw } = await params;
  const tmdbId = Number(raw);
  if (!Number.isInteger(tmdbId)) notFound();

  const db = await createClient();
  const detail = await getShowDetail(db, tmdbId);

  if (!detail) {
    // Not in the library yet — show a live TMDB preview + a follow CTA.
    // Following caches the show + all seasons and revalidates into the full view.
    const show = await getShow(tmdbId).catch(() => null);
    if (!show) notFound();
    const backdrop = imageUrl(show.backdrop_path, 'w780');
    return (
      <div>
        <div className="relative mb-6 aspect-[16/7] w-full overflow-hidden rounded-card bg-ink/5">
          {backdrop ? (
            <Image src={backdrop} alt="" fill sizes="900px" className="object-cover" />
          ) : null}
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tightest-3">{show.name}</h1>
        {show.overview ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{show.overview}</p>
        ) : null}
        <div className="mt-5">
          <FollowButton tmdbId={tmdbId} initialFollowed={false} size="lg" />
          <p className="mt-2 text-xs text-muted">Follow to load every season and start tracking.</p>
        </div>
      </div>
    );
  }

  return (
    <ShowDetailClient
      show={detail.show}
      episodes={detail.episodes}
      watchedKeys={[...detail.watched]}
      isFollowed={detail.isFollowed}
      archived={detail.archived}
    />
  );
}
