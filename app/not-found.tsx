import Link from 'next/link';
import { headers } from 'next/headers';
import { ArrowRight } from 'lucide-react';
import { crateFonts } from './(site)/fonts';
import './(site)/crate.css';
import { PackersSeal } from '@/components/site/GroveScene';

// One 404 serves every host. The trackers keep their own look, so the crate
// label only renders off the tracker subdomains.
const TRACKER_LABELS = new Set(['budget', 'tv']);

export default async function NotFound() {
  const host = (await headers()).get('host') ?? '';
  if (TRACKER_LABELS.has(host.split('.')[0] ?? '')) return <TrackerNotFound />;

  return (
    <div
      className={`crate ${crateFonts} flex min-h-svh items-center justify-center px-4 py-16 sm:px-8`}
    >
      <main
        style={
          { '--rule': 'var(--color-lemon)', '--ground': 'var(--color-lake)' } as React.CSSProperties
        }
        className="label-rule flex w-full max-w-2xl flex-col items-center p-8 text-center sm:p-14"
      >
        <PackersSeal className="enter-stamp w-24 -rotate-6 sm:w-28" />
        <h1 className="mt-6 font-wordmark text-[clamp(6rem,24vw,11rem)] leading-[0.85]">404</h1>
        <p className="mt-4 font-script text-[2.25rem] leading-none text-lemon">Not in this crate</p>
        <p className="mt-6 max-w-[34ch] text-lg leading-relaxed text-mist">
          This page was never packed, or it shipped somewhere else.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
          <Link
            href="/"
            className="press inline-flex min-h-12 items-center justify-center bg-lemon px-6 font-gothic text-lg font-extrabold tracking-[0.12em] text-lake uppercase hover:bg-tangelo hover:text-paper"
          >
            Back to home
          </Link>
          <Link
            href="/projects"
            className="inline-flex min-h-11 items-center gap-2 font-gothic text-lg font-extrabold tracking-[0.12em] text-lemon uppercase"
          >
            <span className="ink-link">See the projects</span>
            <ArrowRight size={18} aria-hidden strokeWidth={2.5} />
          </Link>
        </div>
      </main>
    </div>
  );
}

function TrackerNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5">
      <div className="max-w-md text-center">
        <div className="mb-4 font-mono-tab text-[11px] tracking-wider text-muted uppercase">
          § Missing from the archive
        </div>
        <h1 className="font-display text-[120px] leading-none font-medium tracking-tightest-3 text-ink">
          404
        </h1>
        <p className="mx-auto mt-6 max-w-xs text-[15px] leading-relaxed text-ink/80">
          This page has gone to press in an edition we don’t keep in circulation.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold tracking-wider text-cream uppercase hover:opacity-90"
        >
          Return to Vol. I
        </Link>
      </div>
    </div>
  );
}
