function formatNow() {
  const d = new Date();
  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function Header() {
  return (
    <header className="border-b border-cardline bg-parchment2/60">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 border-2 border-ink rounded-sm flex items-center justify-center font-display font-semibold text-lg shrink-0">
            CI
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold leading-tight tracking-tight">
              Campus Intelligence
            </h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60">
              Unified Dashboard — One Desk, Every Source
            </p>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end font-mono text-xs text-ink/60">
          <span className="uppercase tracking-[0.18em]">Now Showing</span>
          <span className="text-ink">{formatNow()}</span>
        </div>
      </div>
    </header>
  );
}
