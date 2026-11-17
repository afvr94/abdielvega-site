import Image from 'next/image';
import { getWatchProviders, imageUrl } from '@/lib/tv/tmdb';

export async function WatchProviders({ tmdbId }: { tmdbId: number }) {
  const watch = await getWatchProviders(tmdbId).catch(() => null);
  if (!watch || watch.providers.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-2 label-tag">Where to watch</div>
      <div className="flex flex-wrap items-center gap-2">
        {watch.providers.map((p) => {
          const logo = imageUrl(p.logoPath, 'w92');
          return (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card py-1 pr-2.5 pl-1 text-xs"
            >
              {logo ? (
                <Image src={logo} alt="" width={18} height={18} className="rounded-[4px]" />
              ) : null}
              {p.name}
            </span>
          );
        })}
        {watch.link ? (
          <a
            href={watch.link}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-muted underline decoration-hairline underline-offset-2 hover:text-ink"
          >
            via JustWatch
          </a>
        ) : null}
      </div>
    </div>
  );
}
