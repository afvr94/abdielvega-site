import { SectionHeader } from '@/components/site/SectionHeader';
import { ContactForm } from '@/components/site/ContactForm';
import { profile, socials } from '@/lib/portfolio/content';

export const metadata = {
  title: 'Contact',
  description: 'Write to Abdiel Vega. Form or email — whichever you prefer.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
      <SectionHeader
        folio="03 — Correspondence"
        kicker="Letters to the editor"
        title="Write to me"
        summary="For work, ideas, corrections, or simply to say hello. I read everything and reply to what deserves a reply — usually within a day or two."
      />

      <ContactForm />

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="card border border-hairline p-5">
          <div className="label-tag mb-2">Direct</div>
          <a
            href={`mailto:${profile.email}`}
            className="font-mono-tab block text-base hover:text-expense"
          >
            {profile.email}
          </a>
          <p className="mt-2 text-xs text-muted">
            Prefer email? Write to the address above. Include a subject.
          </p>
        </div>
        <div className="card border border-hairline p-5">
          <div className="label-tag mb-2">Elsewhere</div>
          <ul className="font-mono-tab space-y-1 text-sm">
            {socials
              .filter((s) => s.primary)
              .map((s) => (
                <li key={s.name}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-muted hover:text-ink"
                  >
                    {s.name} — {s.handle}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
