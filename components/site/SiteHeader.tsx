'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { nav, profile } from '@/lib/portfolio/content';

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-x-6 px-4 pt-3 sm:px-8 sm:pt-4">
      <Link
        href="/"
        aria-label={`${profile.name}, home`}
        className="press flex min-h-11 items-center gap-3"
      >
        <span
          aria-hidden
          className="grid size-11 place-items-center rounded-full border-2 border-lemon font-wordmark text-[15px] leading-none text-lemon"
        >
          AV
        </span>
        <span className="hidden font-gothic text-lg font-extrabold tracking-[0.12em] uppercase sm:inline">
          {profile.name}
        </span>
      </Link>
      <nav aria-label="Primary">
        <ul className="flex items-center gap-x-3 min-[400px]:gap-x-4 sm:gap-x-7">
          {nav.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-11 items-center font-gothic text-[14px] font-bold tracking-[0.1em] uppercase min-[400px]:text-[15px] min-[400px]:tracking-[0.14em] sm:text-base ${
                    active ? 'text-lemon' : 'text-mist hover:text-paper'
                  }`}
                >
                  <span className="ink-link">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
