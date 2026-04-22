import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-5">
      <div className="max-w-md text-center">
        <div className="font-mono-tab mb-4 text-[11px] uppercase tracking-wider text-muted">
          § Missing from the archive
        </div>
        <h1 className="font-display text-[120px] font-medium leading-none tracking-tightest-3 text-ink">
          404
        </h1>
        <p className="mx-auto mt-6 max-w-xs text-[15px] leading-relaxed text-ink/80">
          This page has gone to press in an edition we don’t keep in circulation.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream hover:opacity-90"
        >
          Return to Vol. I
        </Link>
      </div>
    </div>
  );
}
