export function ProgressRing({
  pct,
  label,
  children,
  className = 'size-12 p-1',
}: {
  pct: number;
  label: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`grid shrink-0 place-items-center rounded-full ${className}`}
      style={{
        background: `conic-gradient(rgb(var(--savings)) ${pct}%, rgb(var(--hairline) / 0.13) 0)`,
      }}
    >
      <span className="grid size-full place-items-center rounded-full bg-card font-mono-tab text-[10px] leading-none">
        {children}
      </span>
    </div>
  );
}
