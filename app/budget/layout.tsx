import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'The Ledger',
  description: 'Personal budget tracker — private.',
};

export default async function BudgetLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <>{children}</>;
}
