import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { profile, stack, bio } from '@/lib/portfolio/content';
import { fetchRepos } from '@/lib/portfolio/github';

export default async function HomePage() {
  const repos = await fetchRepos();
  const featured = repos.slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-12 sm:px-8 sm:pt-20">
      {/* ─────────────────── HERO ─────────────────── */}
      <section className="grid gap-10 sm:grid-cols-[1fr_minmax(220px,280px)] sm:gap-16">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono-tab text-[11px] font-semibold uppercase tracking-wider text-muted">
              § 01 — Masthead
            </span>
            <span className="hairline flex-1 border-t" />
          </div>
          <h1 className="font-display text-[56px] font-medium leading-[0.92] tracking-tightest-3 sm:text-[84px] md:text-[96px]">
            Abdiel
            <br />
            <span className="italic">Vega</span>,
            <br />
            full-stack
            <br />
            engineer.
          </h1>
          <p className="mt-10 max-w-xl text-[17px] leading-[1.55] text-ink/85 sm:text-[19px]">
            <span className="float-left mr-2 mt-1 font-display text-[58px] font-medium leading-[0.85]">
              {bio.lede.charAt(0)}
            </span>
            {bio.lede.slice(1)}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/projects"
              className="group inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream transition-opacity hover:opacity-90"
            >
              See the index
              <ArrowUpRight
                size={14}
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-ink/5"
            >
              Read the bio
            </Link>
          </div>
        </div>

        {/* Aside — masthead card */}
        <aside className="card border border-hairline sm:sticky sm:top-8 sm:self-start">
          <div className="hairline border-b p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="label-tag">Folio</span>
              <span className="font-mono-tab text-xs text-muted">I.I</span>
            </div>
            <div className="font-display text-xl font-semibold leading-none">
              The <span className="italic">standing</span> card
            </div>
          </div>

          <dl className="divide-y divide-hairline text-sm">
            <div className="flex items-baseline justify-between px-5 py-3">
              <dt className="label-tag">Location</dt>
              <dd className="font-mono-tab text-xs">{profile.city}</dd>
            </div>
            <div className="flex items-baseline justify-between px-5 py-3">
              <dt className="label-tag">Practising since</dt>
              <dd className="font-mono-tab text-xs">{profile.since}</dd>
            </div>
            <div className="flex items-baseline justify-between px-5 py-3">
              <dt className="label-tag">Correspondence</dt>
              <dd>
                <a
                  href={`mailto:${profile.email}`}
                  className="font-mono-tab text-xs hover:text-expense"
                >
                  {profile.email}
                </a>
              </dd>
            </div>
            <div className="flex items-baseline justify-between px-5 py-3">
              <dt className="label-tag">Status</dt>
              <dd className="font-mono-tab text-xs text-income">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-income align-middle" />
                Open to work
              </dd>
            </div>
          </dl>

          <div className="hairline border-t p-5">
            <div className="relative mx-auto aspect-[3/4] w-28 overflow-hidden rounded-sm">
              <Image
                src={profile.photo}
                alt={profile.fullName}
                fill
                sizes="120px"
                className="object-cover grayscale"
              />
            </div>
            <p className="font-mono-tab mt-3 text-center text-[10px] uppercase tracking-wider text-muted">
              Photographed, Minneola FL
            </p>
          </div>
        </aside>
      </section>

      {/* ─────────────────── DIVIDER ─────────────────── */}
      <div className="my-20 flex items-center gap-6">
        <span className="hairline flex-1 border-t" />
        <span className="font-display text-xl text-muted">§</span>
        <span className="hairline flex-1 border-t" />
      </div>

      {/* ─────────────────── CURRENTLY ─────────────────── */}
      <section className="mb-20">
        <div className="mb-6 flex items-baseline gap-3">
          <span className="font-mono-tab text-[11px] font-semibold uppercase tracking-wider text-muted">
            § 02
          </span>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Currently</h2>
        </div>
        <div className="card divide-y divide-hairline border border-hairline">
          <CurrentlyRow
            label="Building"
            body="A zero-based budget tracker at budget.abdielvega.com — Supabase + Next.js, editorial twin of this site."
          />
          <CurrentlyRow
            label="Reading"
            body="Whatever engineering rabbit hole caught me this week."
          />
          <CurrentlyRow
            label="Away from a keyboard"
            body="Cycling Central Florida. Lifting. Learning."
          />
        </div>
      </section>

      {/* ─────────────────── STACK ─────────────────── */}
      <section className="mb-20">
        <div className="mb-6 flex items-baseline gap-3">
          <span className="font-mono-tab text-[11px] font-semibold uppercase tracking-wider text-muted">
            § 03
          </span>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">The tools</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {stack.map((group) => (
            <div key={group.label} className="card border border-hairline p-5">
              <div className="label-tag mb-3">{group.label}</div>
              <ul className="font-mono-tab flex flex-wrap gap-x-2 gap-y-1 text-[13px]">
                {group.items.map((item, i) => (
                  <li key={item} className="inline-flex items-center">
                    {i > 0 ? <span className="mx-1 text-muted">·</span> : null}
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────── SELECTED WORK ─────────────────── */}
      <section>
        <div className="mb-6 flex items-baseline justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-mono-tab text-[11px] font-semibold uppercase tracking-wider text-muted">
              § 04
            </span>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">Selected work</h2>
          </div>
          <Link href="/projects" className="label-tag text-ink hover:text-expense">
            Full index →
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="card border border-hairline p-8 text-center text-sm text-muted">
            Repositories failed to load. Try again in a moment.
          </div>
        ) : (
          <ul className="card divide-y divide-hairline overflow-hidden border border-hairline">
            {featured.map((repo, i) => (
              <li key={repo.id}>
                <a
                  href={repo.homepage || repo.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-start gap-4 px-5 py-5 transition-colors hover:bg-ink/[0.02]"
                >
                  <span className="font-mono-tab mt-1 w-6 text-xs text-muted">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <div className="font-display text-lg font-semibold">{repo.name}</div>
                    {repo.description ? (
                      <p className="mt-1 text-sm leading-relaxed text-ink/80">{repo.description}</p>
                    ) : null}
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="mt-2 text-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                  />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CurrentlyRow({ label, body }: { label: string; body: string }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:gap-6">
      <span className="label-tag sm:w-48 sm:shrink-0">{label}</span>
      <span className="text-[15px] leading-relaxed text-ink/90">{body}</span>
    </div>
  );
}
