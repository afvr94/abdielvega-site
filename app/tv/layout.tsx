import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TvNav } from '@/components/tv/TvNav';
import { cliffoTheme } from './fonts';

export const metadata = {
  title: {
    default: 'cliffo',
    template: '%s · cliffo',
  },
  description: 'Personal TV tracker — private.',
  manifest: '/api/tv/manifest',
  appleWebApp: { capable: true, title: 'cliffo', statusBarStyle: 'black' as const },
  icons: { apple: '/cliffo/icon-180.png' },
};

export const viewport = {
  themeColor: '#16121B',
};

export default async function TvLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <div className={`${cliffoTheme} min-h-screen bg-cream`}>
      <TvNav />
      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
    </div>
  );
}
