'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const LINKS = [
  { href: '/', label: 'Up Next' },
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
      <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-lg font-semibold tracking-tightest-2">
          The Marquee
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  active ? 'bg-ink text-cream' : 'text-muted hover:text-ink'
                }`}
              >
                {l.href === '/search' ? (
                  <Search size={13} strokeWidth={2.2} className="inline align-[-2px]" />
                ) : null}
                <span className={l.href === '/search' ? 'ml-1' : ''}>{l.label}</span>
              </Link>
            );
          })}
          <button
            onClick={signOut}
            aria-label="Sign out"
            className="ml-1 rounded-full p-1.5 text-muted transition-colors hover:text-ink"
          >
            <LogOut size={15} strokeWidth={2} />
          </button>
        </nav>
      </div>
    </header>
  );
}
