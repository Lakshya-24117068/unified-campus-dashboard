const ACCENT_CLASSES = {
  sage: { text: "text-sage", border: "border-sage", bg: "bg-sage/10" },
  terracotta: { text: "text-terracotta", border: "border-terracotta", bg: "bg-terracotta/10" },
  brass: { text: "text-brass", border: "border-brass", bg: "bg-brass/10" },
  slateblue: { text: "text-slateblue", border: "border-slateblue", bg: "bg-slateblue/10" }
};

export default function ModuleCard({ title, eyebrow, accent = "sage", status, children, action }) {
  const a = ACCENT_CLASSES[accent] || ACCENT_CLASSES.sage;

  return (
    <section className="module-card rounded-sm overflow-hidden flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="pl-2">
          <p className={`font-mono text-[10px] uppercase tracking-[0.2em] ${a.text} mb-1`}>{eyebrow}</p>
          <h2 className="font-display text-xl font-semibold leading-snug">{title}</h2>
        </div>
        {status && (
          <span
            className={`stamp ${a.text} font-mono text-[10px] uppercase px-2 py-1 shrink-0 whitespace-nowrap`}
            title={status.title}
          >
            {status.label}
          </span>
        )}
      </div>
      <div className="px-5 pb-5 pl-7 flex-1 flex flex-col">{children}</div>
      {action && <div className={`px-5 py-3 border-t border-cardline ${a.bg}`}>{action}</div>}
    </section>
  );
}
