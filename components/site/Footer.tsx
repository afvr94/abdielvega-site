import Link from 'next/link';
import { profile, socials } from '@/lib/portfolio/content';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="hairline mt-24 border-t">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
          <div>
            <div className="label-tag mb-2">Colophon</div>
            <p className="max-w-xs text-sm text-ink">
              {profile.fullName}. {profile.city}. This site set in Fraunces, Instrument Sans, and
              JetBrains Mono. Built with Next.js, deployed on Vercel.
            </p>
          </div>
          <div className="text-center">
            <div className="label-tag mb-3">Correspondence</div>
            <ul className="font-mono-tab flex flex-col items-center gap-1 text-xs">
              <li>
                <a className="hover:text-expense" href={`mailto:${profile.email}`}>
                  {profile.email}
                </a>
              </li>
              {socials.map((s) => (
                <li key={s.name}>
                  <a
                    className="text-muted hover:text-ink"
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {s.name} — {s.handle}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-right">
            <div className="label-tag mb-2">© {year}</div>
            <p className="text-xs text-muted">
              All rights reserved. Typos are features. <br />
              <Link href="/contact" className="text-ink hover:underline">
                Send corrections →
              </Link>
            </p>
          </div>
        </div>
        <div className="font-mono-tab mt-10 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted">
          <span>Est. {profile.since}</span>
          <span>—§—</span>
          <span>abdielvega.com</span>
        </div>
      </div>
    </footer>
  );
}
