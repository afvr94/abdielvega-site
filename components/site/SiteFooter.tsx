import Link from 'next/link';
import { profile, socials } from '@/lib/portfolio/content';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 bg-grove text-paper sm:mt-32">
      <div className="mx-auto max-w-[1320px] px-4 pt-14 pb-8 sm:px-8 sm:pt-20">
        <p
          aria-hidden
          className="font-stencil text-[clamp(3.25rem,13vw,11rem)] leading-[0.82] tracking-[0.02em] text-sprout uppercase"
        >
          {profile.town} · Fla.
        </p>

        <div className="mt-12 grid gap-10 border-t-2 border-sprout pt-8 sm:grid-cols-3">
          <div>
            <h2 className="font-gothic text-sm font-bold tracking-[0.2em] text-lemon uppercase">
              Colophon
            </h2>
            <p className="mt-3 max-w-xs text-[15px] leading-relaxed">
              {profile.fullName}. {profile.city}. This site set in Ultra, Big Shoulders, Yellowtail,
              and Libre Franklin. Built with Next.js, deployed on Vercel.
            </p>
          </div>
          <div>
            <h2 className="font-gothic text-sm font-bold tracking-[0.2em] text-lemon uppercase">
              Correspondence
            </h2>
            <ul className="mt-2 text-[15px]">
              <li>
                <a className="inline-flex min-h-11 items-center" href={`mailto:${profile.email}`}>
                  <span className="ink-link">{profile.email}</span>
                </a>
              </li>
              {socials.map((s) => (
                <li key={s.name}>
                  <a
                    className="inline-flex min-h-11 items-center"
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <span className="ink-link">
                      {s.name} — {s.handle}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-gothic text-sm font-bold tracking-[0.2em] text-lemon uppercase">
              © {year}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed">
              All rights reserved. Typos are features.
            </p>
            <Link href="/contact" className="mt-1 inline-flex min-h-11 items-center text-[15px]">
              <span className="ink-link">Send corrections →</span>
            </Link>
          </div>
        </div>

        <p className="mt-10 font-gothic text-sm font-bold tracking-[0.2em] text-lemon uppercase">
          Packed since {profile.since} · abdielvega.com
        </p>
      </div>
    </footer>
  );
}
