import { createClient } from '@/lib/supabase/server';
import { getServiceOptions, getServices } from '@/lib/tv/queries';
import { ServicesPicker } from '@/components/tv/ServicesPicker';

export const metadata = { title: 'Services' };

export default async function ServicesPage() {
  const db = await createClient();
  const [options, services] = await Promise.all([getServiceOptions(db), getServices(db)]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tightest-3">Your services</h1>
      <p className="mt-2 mb-5 text-sm leading-snug text-muted">
        Pick the streaming services you pay for. Up Next and Calendar show which one has each show,
        and Up Next can narrow to what you can watch now.
      </p>
      {options.length === 0 ? (
        <p className="card border border-hairline p-6 text-sm text-muted">
          Services show up here after the next daily sync.
        </p>
      ) : (
        <ServicesPicker options={options} initial={services} />
      )}
    </div>
  );
}
