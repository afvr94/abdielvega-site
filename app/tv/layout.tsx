import type { Metadata, Viewport } from 'next';
import { TvNav } from '@/components/tv/TvNav';
import { cliffoTheme } from './fonts';

export const metadata: Metadata = {
  title: {
    default: 'cliffo',
    template: '%s · cliffo',
  },
  description: 'Personal TV tracker — private.',
  manifest: '/api/tv/manifest',
  appleWebApp: { capable: true, title: 'cliffo', statusBarStyle: 'black' },
  icons: { apple: '/cliffo/icon-180.png' },
};

export const viewport: Viewport = {
  themeColor: '#16121B',
};

// proxy.ts already gates TV routes and refreshes the session; RLS protects the data.
export default function TvLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${cliffoTheme} min-h-screen bg-cream`}>
      <TvNav />
      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
    </div>
  );
}
