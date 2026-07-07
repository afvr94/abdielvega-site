import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TvNav } from '@/components/tv/TvNav';

export const metadata = {
  title: {
    default: 'The Marquee',
    template: '%s · The Marquee',
  },
  description: 'Personal TV tracker — private.',
};

export default async function TvLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return (
    <div className="min-h-screen bg-cream">
      <TvNav />
      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
    </div>
  );
}
