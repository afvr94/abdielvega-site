'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { nav } from '@/lib/portfolio/content';
import clsx from 'clsx';

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="hairline border-b">
      <ul className="mx-auto flex max-w-5xl items-center justify-center gap-6 px-5 sm:gap-10 sm:px-8">
        {nav.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  'group relative block py-3.5 text-[11px] font-semibold uppercase tracking-[0.25em] transition-colors',
                  active ? 'text-ink' : 'text-muted hover:text-ink'
                )}
              >
                {item.label}
                <span
                  aria-hidden
                  className={clsx(
                    'absolute inset-x-0 -bottom-px h-px bg-ink transition-transform duration-300 ease-out',
                    active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
