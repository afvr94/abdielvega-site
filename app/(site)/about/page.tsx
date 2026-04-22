import Image from 'next/image';
import { Download } from 'lucide-react';
import { SectionHeader } from '@/components/site/SectionHeader';
import { profile, bio, stack, languages } from '@/lib/portfolio/content';

export const metadata = {
  title: 'About',
  description: 'A longer reading on Abdiel Vega — training, practice, and current interests.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
      <SectionHeader
        folio="01 — Biography"
        kicker="In which a portrait is attempted"
        title={`About ${profile.name}`}
        summary={bio.lede}
      />

      <div className="grid gap-10 sm:grid-cols-[1fr_220px] sm:gap-12">
        <article className="prose prose-lg max-w-none font-display text-[18px] leading-[1.6]">
          {bio.full.map((para, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? 'first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-[72px] first-letter:font-semibold first-letter:leading-[0.85]'
                  : 'mt-6'
              }
            >
              {para}
            </p>
          ))}
        </article>

        <aside className="sm:sticky sm:top-8 sm:self-start">
          <figure className="card overflow-hidden border border-hairline">
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={profile.photo}
                alt={profile.fullName}
                fill
                sizes="220px"
                className="object-cover"
              />
            </div>
            <figcaption className="hairline border-t px-4 py-3">
              <div className="font-display text-sm font-semibold">{profile.fullName}</div>
              <div className="font-mono-tab mt-0.5 text-[10px] uppercase tracking-wider text-muted">
                {profile.city}
              </div>
            </figcaption>
          </figure>
        </aside>
      </div>

      {/* ─────────────────── STACK ─────────────────── */}
      <section className="mt-24">
        <div className="mb-6 flex items-baseline gap-3">
          <span className="font-mono-tab text-[11px] font-semibold uppercase tracking-wider text-muted">
            § 02
          </span>
          <h2 className="font-display text-3xl font-semibold">The stack</h2>
        </div>
        <div className="card divide-y divide-hairline overflow-hidden border border-hairline">
          {stack.map((group) => (
            <div
              key={group.label}
              className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-baseline sm:gap-6"
            >
              <div className="label-tag sm:w-40 sm:shrink-0">{group.label}</div>
              <ul className="font-mono-tab flex flex-wrap items-baseline text-[14px]">
                {group.items.map((item, i) => (
                  <li key={item} className="inline-flex items-center">
                    {i > 0 ? <span className="mx-2 text-muted">·</span> : null}
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────── LANGUAGES ─────────────────── */}
      <section className="mt-16">
        <div className="mb-6 flex items-baseline gap-3">
          <span className="font-mono-tab text-[11px] font-semibold uppercase tracking-wider text-muted">
            § 03
          </span>
          <h2 className="font-display text-3xl font-semibold">Languages</h2>
        </div>
        <div className="card divide-y divide-hairline overflow-hidden border border-hairline">
          {languages.map((l) => (
            <div key={l.name} className="flex items-baseline justify-between gap-4 px-5 py-4">
              <span className="font-display text-xl font-semibold">{l.name}</span>
              <span className="font-mono-tab text-xs uppercase tracking-wider text-muted">
                {l.note}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────── RESUME ─────────────────── */}
      <section className="mt-16">
        <div className="mb-6 flex items-baseline gap-3">
          <span className="font-mono-tab text-[11px] font-semibold uppercase tracking-wider text-muted">
            § 04
          </span>
          <h2 className="font-display text-3xl font-semibold">Résumé</h2>
        </div>
        <a
          href={profile.resume}
          target="_blank"
          rel="noreferrer noopener"
          className="card group flex items-center justify-between gap-4 border border-hairline px-6 py-5 transition-colors hover:bg-ink/[0.02]"
        >
          <div>
            <div className="label-tag mb-1">PDF · One page</div>
            <div className="font-display text-xl font-semibold">Download the long form</div>
          </div>
          <Download
            size={20}
            className="text-muted transition-transform group-hover:translate-y-0.5 group-hover:text-ink"
          />
        </a>
      </section>
    </div>
  );
}
