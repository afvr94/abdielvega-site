'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { searchShows, type SearchHit } from '@/app/tv/actions';
import { FollowButton } from './FollowButton';

export function SearchClient() {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();
  const seq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    const id = ++seq.current;
    const t = setTimeout(
      () => {
        if (!q) {
          if (id === seq.current) {
            setHits([]);
            setSearched(false);
          }
          return;
        }
        startTransition(async () => {
          const results = await searchShows(q);
          if (id === seq.current) {
            setHits(results);
            setSearched(true);
          }
        });
      },
      q ? 300 : 0
    );
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div>
      <h1 className="mb-5 font-display text-3xl font-semibold tracking-tightest-3">Search</h1>

      <div className="flex items-center gap-2 border-b border-ink/20 focus-within:border-ink">
        <Search size={18} strokeWidth={2} className="text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a show to follow…"
          autoFocus
          className="w-full bg-transparent py-2.5 text-[15px] focus:outline-none"
        />
      </div>

      <div className="mt-5 space-y-2">
        {hits.map((hit) => (
          <div
            key={hit.tmdbId}
            className="card flex items-center gap-3 border border-hairline p-2.5"
          >
            <Link
              href={`/show/${hit.tmdbId}`}
              className="relative h-20 w-[54px] shrink-0 overflow-hidden rounded-md bg-cream"
            >
              {hit.posterUrl ? (
                <Image src={hit.posterUrl} alt="" fill sizes="54px" className="object-cover" />
              ) : null}
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/show/${hit.tmdbId}`}
                className="font-display font-semibold leading-tight hover:underline"
              >
                {hit.name}
                {hit.year ? (
                  <span className="font-mono-tab ml-1.5 text-xs text-muted">{hit.year}</span>
                ) : null}
              </Link>
              {hit.overview ? (
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">
                  {hit.overview}
                </p>
              ) : null}
            </div>
            <FollowButton tmdbId={hit.tmdbId} initialFollowed={hit.isFollowed} />
          </div>
        ))}

        {searched && !pending && hits.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">No shows match “{query.trim()}”.</p>
        ) : null}
      </div>
    </div>
  );
}
