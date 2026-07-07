'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from './ThemeToggle';

const LINKS = [
  { href: '/', label: 'Up Next' },
  { href: '/shows', label: 'Shows' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/stats', label: 'Stats' },
  { href: '/search', label: 'Search' },
];

export function TvNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3">
        <Link
          href="/"
          className="whitespace-nowrap font-display text-lg font-semibold tracking-tightest-2"
        >
          The Marquee
        </Link>

        {/* Full-width scrollable row on mobile, inline on sm+ */}
        <nav className="no-scrollbar order-3 -mx-5 flex w-full items-center gap-0.5 overflow-x-auto px-5 sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:px-0">
          {LINKS.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  active ? 'bg-ink text-cream' : 'text-muted hover:text-ink'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-0.5 sm:ml-0">
          <ThemeToggle />
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="rounded-full p-1.5 text-muted transition-colors hover:text-ink"
          >
            <LogOut size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
