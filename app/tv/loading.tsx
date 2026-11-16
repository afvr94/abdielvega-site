export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-3 motion-safe:animate-pulse">
      <div className="mb-4 h-9 w-40 rounded-lg bg-ink/5" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-stretch gap-4 card border border-hairline p-3">
          <div className="aspect-video w-32 shrink-0 rounded-lg bg-ink/5 sm:w-40" />
          <div className="flex flex-1 flex-col justify-center gap-2">
            <div className="h-4 w-1/2 rounded bg-ink/5" />
            <div className="h-3 w-2/3 rounded bg-ink/5" />
            <div className="h-2 w-1/3 rounded bg-ink/5" />
          </div>
          <div className="w-14 shrink-0 rounded-lg bg-ink/5" />
        </div>
      ))}
    </div>
  );
}
