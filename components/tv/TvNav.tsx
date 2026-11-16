'use client';

import { useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, CalendarDays, LayoutGrid, LogOut, PlayCircle, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const LINKS = [
  { href: '/', label: 'Up Next', Icon: PlayCircle },
  { href: '/shows', label: 'Shows', Icon: LayoutGrid },
  { href: '/calendar', label: 'Calendar', Icon: CalendarDays },
  { href: '/stats', label: 'Stats', Icon: BarChart3 },
  { href: '/search', label: 'Search', Icon: Search },
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
      <div className="mx-auto flex max-w-4xl items-center gap-4 px-5 py-3">
        <Link href="/" className="shrink-0">
          <Image src="/cliffo/logo.svg" alt="cliffo" width={80} height={28} priority />
        </Link>

        {/* A floating tab bar within thumb reach on phones, inline in the header on sm+. */}
        <nav
          ref={navRef}
          className="fixed inset-x-2.5 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex items-stretch rounded-[22px] border border-hairline bg-card/95 p-1.5 backdrop-blur-md sm:static sm:z-auto sm:flex-1 sm:items-center sm:gap-0.5 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none"
        >
          <span
            ref={pillRef}
            data-nav-pill
            aria-hidden
            style={{ opacity: 0 }}
            className="pointer-events-none absolute inset-y-1.5 left-0 rounded-2xl bg-income transition-[transform,width] duration-[380ms] ease-[var(--ease)] sm:inset-y-0 sm:rounded-full sm:border sm:border-hairline sm:bg-ink/10"
          />
          {LINKS.map((l) => {
            const active = l.href === activeHref;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`tab-label relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-medium whitespace-nowrap sm:min-h-0 sm:flex-none sm:rounded-full sm:px-3 sm:py-1.5 sm:text-xs sm:font-semibold sm:tracking-wider sm:uppercase ${
                  active ? 'text-cream sm:text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                <l.Icon size={20} strokeWidth={2} aria-hidden className="sm:hidden" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-0.5 sm:ml-0">
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="grid size-11 place-items-center rounded-full text-muted hover:text-ink"
          >
            <LogOut size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
