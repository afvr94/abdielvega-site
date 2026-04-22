import { profile } from '@/lib/portfolio/content';

const ROMAN_DIGITS: Array<[number, string]> = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

function toRoman(n: number) {
  let out = '';
  let remaining = n;
  for (const [v, s] of ROMAN_DIGITS) {
    while (remaining >= v) {
      out += s;
      remaining -= v;
    }
  }
  return out;
}

export function Masthead() {
  const now = new Date();
  const year = toRoman(now.getUTCFullYear());
  const month = now.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  return (
    <header className="hairline border-b">
      <div className="mx-auto max-w-5xl px-5 py-3 sm:px-8">
        <div className="label-tag text-center text-[9px]">{profile.strapline}</div>
      </div>
      <div className="hairline border-t">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="label-tag">Vol. {year}</div>
          <div className="font-display text-lg font-semibold tracking-tight sm:text-xl">
            Abdiel Vega
            <span className="text-muted"> · </span>
            <span className="italic text-muted">Portfolio</span>
          </div>
          <div className="label-tag">{month} Edn.</div>
        </div>
      </div>
    </header>
  );
}
