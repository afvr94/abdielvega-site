import Link from 'next/link';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getLibrary } from '@/lib/tv/queries';
import { ShowsLibrary } from '@/components/tv/ShowsLibrary';

export const metadata = { title: 'Shows' };

export default async function ShowsPage() {
  const db = await createClient();
  const items = await getLibrary(db);

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tightest-3">No shows yet</h1>
        <Link
          href="/search"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-wider text-cream transition-opacity hover:opacity-90"
        >
          <Search size={14} strokeWidth={2} /> Search shows
        </Link>
      </div>
    );
  }

  return <ShowsLibrary items={items} />;
}
