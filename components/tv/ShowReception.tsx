import { Star } from 'lucide-react';
import { getShowReception } from '@/lib/tv/tmdb';

export async function ShowReception({ tmdbId }: { tmdbId: number }) {
  const reception = await getShowReception(tmdbId).catch(() => null);
  if (!reception?.score && !reception?.reviews.length) return null;
  const { score, reviews } = reception;

  return (
    <div className="mb-6 text-xs">
      {score ? (
        <div className="flex items-center gap-1.5">
          <Star size={13} className="fill-income text-income" aria-hidden />
          <span className="font-semibold text-ink">{score.voteAverage.toFixed(1)}</span>
          <span className="text-muted">
            · {score.voteCount.toLocaleString('en-US')} votes on TMDB
          </span>
        </div>
      ) : null}
      {reviews.length > 0 ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-muted hover:text-ink">
            Reviews ({reviews.length}) · may contain spoilers
          </summary>
          <ul className="mt-3 space-y-3">
            {reviews.map((r) => (
              <li key={r.url} className="card border border-hairline p-3">
                <div className="mb-1 flex items-center gap-2 text-muted">
                  <span className="font-semibold text-ink">{r.author}</span>
                  {r.rating !== null ? <span>★ {r.rating}/10</span> : null}
                </div>
                <p className="leading-relaxed whitespace-pre-line text-muted">{r.excerpt}</p>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-[11px] text-muted underline decoration-hairline underline-offset-2 hover:text-ink"
                >
                  Read on TMDB
                </a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
