'use client';

import { useRouter } from 'next/navigation';
import { Shuffle } from 'lucide-react';

// Jumps to a random show from the "behind" list — kills decision paralysis.
export function SurpriseButton({ showIds }: { showIds: number[] }) {
  const router = useRouter();
  if (showIds.length === 0) return null;

  function surprise() {
    const id = showIds[Math.floor(Math.random() * showIds.length)];
    if (id !== undefined) router.push(`/show/${id}`);
  }

  return (
    <button
      onClick={surprise}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-hairline bg-card px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted transition-colors hover:border-savings hover:text-savings"
    >
      <Shuffle size={13} strokeWidth={2.2} /> Surprise me
    </button>
  );
}
