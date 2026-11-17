import Image from 'next/image';
import type { Provider } from '@/lib/tv/types';
import { imageUrl } from '@/lib/tv/tmdb';

export function ServiceBadge({ provider }: { provider: Provider }) {
  const logo = imageUrl(provider.logoPath, 'w92');
  return (
    <span className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap">
      {logo ? (
        <Image src={logo} alt="" width={14} height={14} className="shrink-0 rounded-[3px]" />
      ) : null}
      <span className="truncate">{provider.name}</span>
    </span>
  );
}
