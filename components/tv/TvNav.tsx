'use client';

import { useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const LINKS = [
  { href: '/', label: 'Up Next' },
  { href: '/shows', label: 'Shows' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/stats', label: 'Stats' },
  { href: '/search', label: 'Search' },
];

function isActive(href: string, pathname: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function TvNav() {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const placedHref = useRef<string | null>(null);
  const activeHref = LINKS.find((l) => isActive(l.href, pathname))?.href ?? null;

  useLayoutEffect(() => {
    const nav = navRef.current;
    const pill = pillRef.current;
    if (!nav || !pill) return;

    const place = (slide: boolean) => {
      const tab = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!tab) {
        pill.style.opacity = '0';
        return;
      }
      pill.style.transition = slide ? '' : 'none';
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
      pill.style.opacity = '1';
    };

    const tabChanged = placedHref.current !== null && placedHref.current !== activeHref;
    place(tabChanged);
    placedHref.current = activeHref;

    if (typeof ResizeObserver === 'undefined') return;
    // Only re-place on a real size change, so the observer's initial callback can't cut a slide short.
    const observer = new ResizeObserver(() => {
      const tab = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (
        tab &&
        pill.style.width === `${tab.offsetWidth}px` &&
        pill.style.transform === `translateX(${tab.offsetLeft}px)`
      )
        return;
      place(false);
    });
    observer.observe(nav);
    // Tabs change width without the nav resizing when the web fonts swap in.
    nav.querySelectorAll('a').forEach((tab) => observer.observe(tab));
    return () => observer.disconnect();
  }, [activeHref]);

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="border-b border-hairline pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
        <Link href="/" className="shrink-0">
          <Image src="/cliffo/logo.svg" alt="cliffo" width={80} height={28} priority />
        </Link>

        {/* Full-width scrollable row on mobile, inline on sm+ */}
        <nav
          ref={navRef}
          className="relative order-3 -mx-5 no-scrollbar flex w-full items-center gap-0.5 overflow-x-auto px-5 sm:order-0 sm:mx-0 sm:w-auto sm:flex-1 sm:px-0"
        >
          <span
            ref={pillRef}
            data-nav-pill
            aria-hidden
            style={{ opacity: 0 }}
            className="pointer-events-none absolute inset-y-0 left-0 rounded-full border border-hairline bg-ink/10 transition-[transform,width] duration-[380ms] ease-[var(--ease)]"
          />
          {LINKS.map((l) => {
            const active = l.href === activeHref;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`tab-label relative rounded-full px-3 py-1.5 text-xs font-semibold tracking-wider whitespace-nowrap uppercase ${
                  active ? 'text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-0.5 sm:ml-0">
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="rounded-full p-1.5 text-muted hover:text-ink"
          >
            <LogOut size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
