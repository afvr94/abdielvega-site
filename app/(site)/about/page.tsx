import type { CSSProperties } from 'react';
import Image from 'next/image';
import { Download } from 'lucide-react';
import { profile, bio, stack, languages } from '@/lib/portfolio/content';

export const metadata = {
  title: 'About',
  description: 'A longer reading on Abdiel Vega — training, practice, and current interests.',
};

const paper = { '--rule': 'var(--color-lake)', '--ground': 'var(--color-paper)' } as CSSProperties;

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-10 sm:px-8 sm:pt-16">
      <header className="grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-8">
          <h1 className="enter-stamp font-wordmark text-[clamp(3rem,8vw,7rem)] leading-[0.9]">
            About
            <br />
            {profile.name}
          </h1>
          <p className="mt-8 max-w-[36ch] text-[clamp(1.25rem,2vw,1.6rem)] leading-snug text-mist">
            {bio.lede}
          </p>
        </div>
        <div className="lg:col-span-4">
          <div className="mx-auto w-full max-w-[300px] rounded-[50%] border-[3px] border-lemon p-2">
            <div className="duotone relative aspect-[3/4] overflow-hidden rounded-[50%]">
              <Image
                src={profile.photo}
                alt={`Portrait of ${profile.fullName}`}
                fill
                priority
                sizes="300px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <section aria-labelledby="bio-title" className="mt-24 sm:mt-32">
        <div
          style={paper}
          className="label-rule grid gap-8 bg-paper p-7 text-lake sm:p-12 lg:grid-cols-12 lg:p-16"
        >
          <h2 id="bio-title" className="font-wordmark text-3xl sm:text-4xl lg:col-span-4">
            Biography
          </h2>
          <div className="max-w-[65ch] space-y-6 text-[18px] leading-[1.7] sm:text-[19px] lg:col-span-8">
            {bio.full.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="stack-title" className="mt-24 sm:mt-32">
        <h2 id="stack-title" className="font-wordmark text-[clamp(2.5rem,6vw,5rem)] leading-[0.95]">
          The stack
        </h2>
        <dl className="mt-10 border-t-2 border-reef">
          {stack.map((group) => (
            <div
              key={group.label}
              className="grid gap-2 border-b-2 border-reef py-6 sm:grid-cols-12 sm:items-baseline sm:gap-8"
            >
              <dt className="font-wordmark text-2xl text-lemon sm:col-span-4">{group.label}</dt>
              <dd className="font-gothic text-xl font-bold tracking-[0.08em] uppercase sm:col-span-8">
                {group.items.join(' · ')}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="lang-title" className="mt-24 sm:mt-32">
        <h2 id="lang-title" className="font-wordmark text-[clamp(2.5rem,6vw,5rem)] leading-[0.95]">
          Languages
        </h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {languages.map((l, i) => (
            <li
              key={l.name}
              style={
                {
                  '--rule': 'var(--color-lemon)',
                  '--ground': i === 0 ? 'var(--color-grove)' : 'var(--color-lake-deep)',
                } as CSSProperties
              }
              className={`label-rule flex items-baseline justify-between gap-4 p-7 sm:p-9 ${
                i === 0 ? 'bg-grove' : 'bg-lake-deep'
              }`}
            >
              <span className="font-wordmark text-3xl">{l.name}</span>
              <span className="font-gothic text-lg font-bold tracking-[0.16em] text-lemon uppercase">
                {l.note}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="resume-title" className="mt-24 sm:mt-32">
        <h2 id="resume-title" className="sr-only">
          Résumé
        </h2>
        <a
          href={profile.resume}
          target="_blank"
          rel="noreferrer noopener"
          style={
            { '--rule': 'var(--color-lake)', '--ground': 'var(--color-lemon)' } as CSSProperties
          }
          className="lift label-rule group flex flex-col gap-6 bg-lemon p-8 text-lake sm:flex-row sm:items-center sm:justify-between sm:p-12"
        >
          <span>
            <span className="block font-wordmark text-[clamp(2rem,4.5vw,3.75rem)] leading-none">
              Download the long form
            </span>
            <span className="mt-3 block font-gothic text-lg font-bold tracking-[0.16em] uppercase">
              Résumé · PDF · One page
            </span>
          </span>
          <Download
            size={44}
            aria-hidden
            strokeWidth={2.25}
            className="shrink-0 transition-transform duration-300 group-hover:translate-y-1"
          />
        </a>
      </section>
    </div>
  );
}
