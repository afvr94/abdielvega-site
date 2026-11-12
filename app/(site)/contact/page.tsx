import type { CSSProperties } from 'react';
import { ContactForm } from '@/components/site/ContactForm';
import { profile, socials, contactSummary } from '@/lib/portfolio/content';

export const metadata = {
  title: 'Contact',
  description: 'Write to Abdiel Vega. Form or email — whichever you prefer.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-10 sm:px-8 sm:pt-16">
      <header>
        <h1 className="enter-stamp font-wordmark text-[clamp(3rem,9vw,8rem)] leading-[0.9]">
          Write to me
        </h1>
      </header>
      <p className="mt-8 max-w-[52ch] text-[clamp(1.15rem,1.8vw,1.4rem)] leading-relaxed text-mist">
        {contactSummary}
      </p>

      <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8">
          <ContactForm />
        </div>

        <aside className="space-y-5 lg:col-span-4">
          <div
            style={
              { '--rule': 'var(--color-lemon)', '--ground': 'var(--color-grove)' } as CSSProperties
            }
            className="label-rule bg-grove p-7"
          >
            <h2 className="font-wordmark text-2xl text-lemon">Direct</h2>
            <a
              href={`mailto:${profile.email}`}
              className="mt-3 inline-flex min-h-11 items-center text-lg font-semibold"
            >
              <span className="ink-link">{profile.email}</span>
            </a>
            <p className="mt-1 text-[15px] leading-relaxed">
              Prefer email? Write to the address above. Include a subject.
            </p>
          </div>
          <div
            style={
              {
                '--rule': 'var(--color-lemon)',
                '--ground': 'var(--color-lake-deep)',
              } as CSSProperties
            }
            className="label-rule bg-lake-deep p-7"
          >
            <h2 className="font-wordmark text-2xl text-lemon">Elsewhere</h2>
            <ul className="mt-2">
              {socials
                .filter((s) => s.primary)
                .map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex min-h-11 items-center text-lg"
                    >
                      <span className="ink-link">
                        {s.name} — {s.handle}
                      </span>
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
