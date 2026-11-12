import { fetchRepos } from '@/lib/portfolio/github';
import { ProjectLabel } from '@/components/site/ProjectLabel';

export const metadata = {
  title: 'Projects',
  description: 'The index — open-source projects and repositories by Abdiel Vega.',
};

export const revalidate = 1800;

// A repeating run of label widths so the crate never reads as a uniform grid.
const SPANS = [
  'lg:col-span-7',
  'lg:col-span-5',
  'lg:col-span-5',
  'lg:col-span-7',
  'md:col-span-2 lg:col-span-12',
];

export default async function ProjectsPage() {
  const repos = await fetchRepos();
  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-10 sm:px-8 sm:pt-16">
      <header className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <h1 className="enter-stamp font-wordmark text-[clamp(3.5rem,10vw,8rem)] leading-[0.86] lg:col-span-7">
          Projects
        </h1>
        <div className="lg:col-span-5">
          <p className="text-lg leading-relaxed text-mist">
            A running index of open-source work. Updated from GitHub every thirty minutes or so —
            the pushed date tells you how fresh each entry is.
          </p>
          {repos.length > 0 ? (
            <p className="mt-4 font-gothic text-lg font-bold tracking-[0.14em] text-lemon uppercase">
              {repos.length} {repos.length === 1 ? 'entry' : 'entries'} · Sorted — recently pushed
            </p>
          ) : null}
        </div>
      </header>

      {repos.length === 0 ? (
        <p className="mt-16 border-2 border-reef p-8 text-lg text-mist">
          Couldn’t fetch repositories from GitHub. Check back shortly.
        </p>
      ) : (
        <ul className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-12">
          {repos.map((repo, i) => (
            <li key={repo.id} className={SPANS[i % SPANS.length]}>
              <ProjectLabel repo={repo} index={i} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
