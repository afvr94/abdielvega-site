import { ArrowUpRight, Star } from 'lucide-react';
import { SectionHeader } from '@/components/site/SectionHeader';
import { fetchRepos } from '@/lib/portfolio/github';

export const metadata = {
  title: 'Projects',
  description: 'The index — open-source projects and repositories by Abdiel Vega.',
};

export const revalidate = 1800;

function formatDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    .toUpperCase();
}

export default async function ProjectsPage() {
  const repos = await fetchRepos();
  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
      <SectionHeader
        folio="02 — The Index"
        kicker="Archive of public repositories"
        title="Projects"
        summary="A running index of open-source work. Updated from GitHub every thirty minutes or so — the pushed date tells you how fresh each entry is."
      />

      {repos.length === 0 ? (
        <div className="card border border-hairline p-8 text-center text-sm text-muted">
          Couldn’t fetch repositories from GitHub. Check back shortly.
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-baseline justify-between">
            <span className="label-tag">
              {repos.length} {repos.length === 1 ? 'entry' : 'entries'}
            </span>
            <span className="label-tag">Sorted — recently pushed</span>
          </div>
          <ul className="card divide-y divide-hairline overflow-hidden border border-hairline">
            {repos.map((repo, i) => (
              <li key={repo.id}>
                <a
                  href={repo.homepage || repo.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group grid grid-cols-[2rem_1fr_auto] items-start gap-4 px-5 py-5 transition-colors hover:bg-ink/[0.02] sm:grid-cols-[2.5rem_1fr_auto_auto] sm:gap-6 sm:px-6"
                >
                  <span className="font-mono-tab mt-1 text-xs text-muted">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-display text-xl font-semibold">{repo.name}</h3>
                      {repo.language ? (
                        <span className="font-mono-tab text-[10px] uppercase tracking-wider text-muted">
                          {repo.language}
                        </span>
                      ) : null}
                    </div>
                    {repo.description ? (
                      <p className="mt-1.5 text-sm leading-relaxed text-ink/80">
                        {repo.description}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-sm italic text-muted">No description.</p>
                    )}
                    {repo.topics.length > 0 ? (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {repo.topics.slice(0, 6).map((t) => (
                          <li
                            key={t}
                            className="font-mono-tab rounded-full bg-ink/[0.06] px-2 py-0.5 text-[10px] lowercase tracking-wider text-ink/70"
                          >
                            {t}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="hidden flex-col items-end gap-1 text-right sm:flex">
                    <span className="font-mono-tab text-[10px] uppercase tracking-wider text-muted">
                      {formatDate(repo.pushedAt)}
                    </span>
                    {repo.stars > 0 ? (
                      <span className="font-mono-tab inline-flex items-center gap-1 text-[11px] text-muted">
                        <Star size={10} /> {repo.stars}
                      </span>
                    ) : null}
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="mt-1.5 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                  />
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
