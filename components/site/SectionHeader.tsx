type Props = {
  folio: string;
  kicker?: string;
  title: string;
  summary?: string;
};

export function SectionHeader({ folio, kicker, title, summary }: Props) {
  return (
    <header className="mb-10">
      <div className="mb-3 flex items-baseline gap-3">
        <span className="font-mono-tab text-[11px] font-semibold uppercase tracking-wider text-muted">
          § {folio}
        </span>
        {kicker ? <span className="label-tag text-ink/60">{kicker}</span> : null}
      </div>
      <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tightest-3 sm:text-5xl">
        {title}
      </h1>
      {summary ? <p className="mt-3 max-w-2xl text-base text-muted sm:text-lg">{summary}</p> : null}
    </header>
  );
}
