import type { CSSProperties } from 'react';
import { ArrowUpRight, Star } from 'lucide-react';
import type { GithubRepo } from '@/lib/portfolio/github';

// Each label gets its own ink pairing and layout, like a crate of different brands.
const INKS = [
  {
    ground: 'var(--color-paper)',
    rule: 'var(--color-lake)',
    box: 'bg-paper text-lake',
    name: 'text-lake',
    meta: 'text-grove',
  },
  {
    ground: 'var(--color-grove)',
    rule: 'var(--color-lemon)',
    box: 'bg-grove text-paper',
    name: 'text-lemon',
    meta: 'text-paper',
  },
  {
    ground: 'var(--color-lemon)',
    rule: 'var(--color-lake)',
    box: 'bg-lemon text-lake',
    name: 'text-lake',
    meta: 'text-lake',
  },
  {
    ground: 'var(--color-lake-deep)',
    rule: 'var(--color-lemon)',
    box: 'bg-lake-deep text-paper',
    name: 'text-paper',
    meta: 'text-mist',
  },
] as const;

function packed(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function ProjectLabel({
  repo,
  index,
  className = '',
}: {
  repo: GithubRepo;
  index: number;
  className?: string;
}) {
  const ink = INKS[index % INKS.length]!;
  const centred = index % 2 === 0;
  const style = { '--rule': ink.rule, '--ground': ink.ground } as CSSProperties;

  return (
    <a
      href={repo.homepage || repo.url}
      target="_blank"
      rel="noreferrer noopener"
      style={style}
      className={`lift label-rule group flex h-full flex-col p-6 sm:p-8 ${ink.box} ${
        centred ? 'items-center text-center' : ''
      } ${className}`}
    >
      <h3
        className={`font-wordmark text-[clamp(1.6rem,3vw,2.5rem)] leading-[1.02] [overflow-wrap:anywhere] ${ink.name}`}
      >
        {repo.name}
      </h3>

      {/* The variety line sits under the brand name, as on a crate label. */}
      <p className={`mt-3 font-gothic text-sm font-bold tracking-[0.18em] uppercase ${ink.meta}`}>
        {repo.language ? `${repo.language} · ` : null}Packed {packed(repo.pushedAt)}
      </p>

      <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed">
        {repo.description || 'No description.'}
      </p>

      <div
        className={`mt-auto flex w-full flex-wrap items-center gap-x-4 gap-y-2 pt-6 font-gothic text-sm font-bold tracking-[0.14em] uppercase ${ink.meta} ${
          centred ? 'justify-center' : 'justify-between'
        }`}
      >
        {repo.topics.length > 0 ? <span>{repo.topics.slice(0, 3).join(' · ')}</span> : null}
        <span className="inline-flex items-center gap-3">
          {repo.stars > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Star size={14} aria-hidden strokeWidth={2.5} />
              <span className="sr-only">Stars:</span> {repo.stars}
            </span>
          ) : null}
          <ArrowUpRight
            size={20}
            aria-hidden
            strokeWidth={2.5}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </div>
    </a>
  );
}
