import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Download } from 'lucide-react';
import { profile, stack, bio, contactSummary } from '@/lib/portfolio/content';
import { fetchRepos } from '@/lib/portfolio/github';
import { GroveScene, PackersSeal } from '@/components/site/GroveScene';
import { ProjectLabel } from '@/components/site/ProjectLabel';

const currently = [
  {
    label: 'Building',
    body: 'A zero-based budget tracker at budget.abdielvega.com — Supabase + Next.js.',
  },
  { label: 'Reading', body: 'Whatever engineering rabbit hole caught me this week.' },
  { label: 'Away from a keyboard', body: 'Cycling Central Florida. Lifting. Learning.' },
];

const TOOL_INKS = [
  {
    box: 'bg-paper text-lake',
    head: 'text-lake',
    rule: 'var(--color-lake)',
    ground: 'var(--color-paper)',
  },
  {
    box: 'bg-grove text-paper',
    head: 'text-lemon',
    rule: 'var(--color-lemon)',
    ground: 'var(--color-grove)',
  },
  {
    box: 'bg-reef text-paper',
    head: 'text-paper',
    rule: 'var(--color-paper)',
    ground: 'var(--color-reef)',
  },
  {
    box: 'bg-lemon text-lake',
    head: 'text-lake',
    rule: 'var(--color-lake)',
    ground: 'var(--color-lemon)',
  },
] as const;

const FEATURE_SPANS = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-12'];

function inks(rule: string, ground: string) {
  return { '--rule': rule, '--ground': ground } as CSSProperties;
}

export default async function HomePage() {
  const repos = await fetchRepos();
  const featured = repos.slice(0, 3);

  const contents = [
    { name: 'HIIT timer', note: 'Interval timer · public', href: '/hiit' },
    { name: 'The Ledger', note: 'Zero-based budget tracker · private' },
    { name: 'The Marquee', note: 'TV series tracker · private' },
    {
      name: repos.length > 0 ? `${repos.length} repositories` : 'Repositories',
      note: 'Open source on GitHub',
      href: '/projects',
    },
  ];

  return (
    <>
      {/* ── The label ── */}
      <section aria-labelledby="hero-title" className="mx-auto max-w-[1320px] px-4 pt-5 sm:px-8">
        <div
          style={inks('var(--color-lemon)', 'var(--color-lake)')}
          className="label-rule grid gap-x-8 gap-y-10 p-5 sm:p-8 lg:min-h-[calc(100svh-6.5rem)] lg:grid-cols-12 lg:grid-rows-[1fr_auto] lg:p-10"
        >
          <div className="relative flex flex-col lg:col-span-7">
            <PackersSeal
              style={{ '--d': '1300ms' } as CSSProperties}
              className="enter-stamp absolute top-0 right-0 hidden w-28 -rotate-12 sm:block xl:w-32"
            />
            <h1
              id="hero-title"
              className="enter-stamp font-wordmark text-[clamp(3.5rem,10vw,8rem)] leading-[0.86] text-paper"
            >
              Abdiel
              <br />
              Vega
            </h1>
            <p className="enter-wipe mt-6 self-start bg-lemon px-4 py-2 font-gothic text-[clamp(1.2rem,2.3vw,1.9rem)] leading-tight font-extrabold tracking-[0.1em] text-lake uppercase">
              {profile.title} · {profile.town}, Fla.
            </p>
            <p
              style={{ '--d': '480ms' } as CSSProperties}
              className="enter-rise mt-4 font-gothic text-base font-bold tracking-[0.16em] text-mist uppercase"
            >
              {profile.strapline}
            </p>

            <div
              style={{ '--d': '700ms' } as CSSProperties}
              className="enter-rise mt-10 lg:mt-auto lg:pt-10"
            >
              <h2 className="font-script text-[2rem] leading-none text-lemon">In this crate</h2>
              <ul className="mt-3 border-t-2 border-reef">
                {contents.map((item) => {
                  const row = (
                    <>
                      <span>
                        <span className="block font-gothic text-lg font-extrabold tracking-[0.1em] uppercase">
                          {item.name}
                        </span>
                        <span className="block text-[15px] text-mist">{item.note}</span>
                      </span>
                      {item.href ? (
                        <ArrowRight
                          size={22}
                          aria-hidden
                          className="text-lemon transition-transform duration-300 group-hover:translate-x-1"
                        />
                      ) : null}
                    </>
                  );
                  return (
                    <li key={item.name} className="border-b-2 border-reef">
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="group flex min-h-11 items-center justify-between gap-4 py-2.5 hover:text-lemon"
                        >
                          {row}
                        </Link>
                      ) : (
                        <div className="flex min-h-11 items-center justify-between gap-4 py-2.5">
                          {row}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="flex items-end justify-center lg:col-span-5 lg:row-span-1">
            <GroveScene className="w-full max-w-[460px] lg:max-w-none" />
          </div>

          <div
            style={{ '--d': '900ms' } as CSSProperties}
            className="enter-rise flex flex-col gap-5 border-t-2 border-lemon pt-6 lg:col-span-12 lg:flex-row lg:items-center lg:justify-between"
          >
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-script text-[1.75rem] leading-none text-lemon">Packed by</span>
              <span className="font-gothic text-lg font-bold tracking-[0.12em] uppercase">
                {profile.fullName} · Est. {profile.since} ·{' '}
                <span className="text-lemon">Open to work</span>
              </span>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={profile.resume}
                target="_blank"
                rel="noreferrer noopener"
                className="press inline-flex min-h-12 items-center justify-center gap-2 bg-lemon px-6 font-gothic text-lg font-extrabold tracking-[0.12em] text-lake uppercase hover:bg-tangelo hover:text-paper"
              >
                <Download size={18} aria-hidden strokeWidth={2.5} />
                Download résumé
              </a>
              <Link
                href="/contact"
                className="press inline-flex min-h-12 items-center justify-center gap-2 border-2 border-paper px-6 font-gothic text-lg font-extrabold tracking-[0.12em] uppercase hover:border-tangelo hover:bg-tangelo"
              >
                Write to me
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── The lede inks in as it scrolls into view ── */}
      <section
        aria-labelledby="lede-title"
        className="mx-auto max-w-[1320px] px-4 pt-28 sm:px-8 sm:pt-40"
      >
        <h2 id="lede-title" className="sr-only">
          Introduction
        </h2>
        <p className="ink-words max-w-[26ch] text-[clamp(1.75rem,4vw,3.5rem)] leading-[1.14] font-semibold tracking-[-0.02em]">
          {bio.lede.split(' ').map((word, i) => (
            <span key={i}>{word} </span>
          ))}
        </p>
        <Link
          href="/about"
          className="mt-10 inline-flex min-h-11 items-center gap-2 font-gothic text-xl font-extrabold tracking-[0.12em] text-lemon uppercase"
        >
          <span className="ink-link">Read the bio</span>
          <ArrowRight size={20} aria-hidden strokeWidth={2.5} />
        </Link>
      </section>

      {/* ── Currently ── */}
      <section aria-labelledby="currently-title" className="mt-28 bg-lemon text-lake sm:mt-40">
        <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 sm:py-28">
          <h2
            id="currently-title"
            className="font-wordmark text-[clamp(2.75rem,6.5vw,5.5rem)] leading-[0.95]"
          >
            Currently
          </h2>
          <dl className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {currently.map((row) => (
              <div key={row.label} className="border-t-[3px] border-lake pt-5">
                <dt className="font-gothic text-xl font-extrabold tracking-[0.12em] uppercase">
                  {row.label}
                </dt>
                <dd className="mt-3 text-lg leading-relaxed">{row.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── The tools ── */}
      <section
        aria-labelledby="tools-title"
        className="mx-auto max-w-[1320px] px-4 pt-28 sm:px-8 sm:pt-40"
      >
        <h2
          id="tools-title"
          className="font-wordmark text-[clamp(2.75rem,6.5vw,5.5rem)] leading-[0.95] text-paper"
        >
          The tools
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stack.map((group, i) => {
            const ink = TOOL_INKS[i % TOOL_INKS.length]!;
            return (
              <div
                key={group.label}
                style={inks(ink.rule, ink.ground)}
                className={`label-rule p-6 sm:p-7 ${ink.box}`}
              >
                <h3 className={`font-wordmark text-2xl ${ink.head}`}>{group.label}</h3>
                <ul className="mt-5 space-y-1.5 font-gothic text-lg font-bold tracking-[0.08em] uppercase">
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Selected work ── */}
      <section
        aria-labelledby="work-title"
        className="mx-auto max-w-[1320px] px-4 pt-28 sm:px-8 sm:pt-40"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2
            id="work-title"
            className="font-wordmark text-[clamp(2.75rem,6.5vw,5.5rem)] leading-[0.95] text-paper"
          >
            Selected work
          </h2>
          <Link
            href="/projects"
            className="inline-flex min-h-11 items-center gap-2 font-gothic text-xl font-extrabold tracking-[0.12em] text-lemon uppercase"
          >
            <span className="ink-link">Full index</span>
            <ArrowUpRight size={20} aria-hidden strokeWidth={2.5} />
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="mt-12 border-2 border-reef p-8 text-lg text-mist">
            Repositories failed to load. Try again in a moment.
          </p>
        ) : (
          <div className="mt-12 grid gap-5 lg:grid-cols-12">
            {featured.map((repo, i) => (
              <ProjectLabel key={repo.id} repo={repo} index={i} className={FEATURE_SPANS[i]} />
            ))}
          </div>
        )}
      </section>

      {/* ── Close ── */}
      <section
        aria-labelledby="close-title"
        className="mx-auto max-w-[1320px] px-4 pt-28 sm:px-8 sm:pt-40"
      >
        <div
          style={inks('var(--color-lake)', 'var(--color-paper)')}
          className="label-rule grid gap-8 bg-paper p-8 text-lake sm:p-12 lg:grid-cols-12 lg:items-end lg:p-16"
        >
          <h2
            id="close-title"
            className="font-wordmark text-[clamp(2.75rem,6vw,5.25rem)] leading-[0.9] lg:col-span-7"
          >
            Write to me
          </h2>
          <div className="lg:col-span-5">
            <p className="text-lg leading-relaxed">{contactSummary}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <Link
                href="/contact"
                className="press inline-flex min-h-12 items-center justify-center bg-lake px-6 font-gothic text-lg font-extrabold tracking-[0.12em] text-paper uppercase hover:bg-tangelo"
              >
                Send a letter
              </Link>
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex min-h-11 items-center text-lg font-semibold"
              >
                <span className="ink-link">{profile.email}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
