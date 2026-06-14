import { useEffect, useState } from "react";
import { fetchJson, SOURCES } from "../lib/api";
import ModuleCard from "./ModuleCard";

const CATEGORY_COLOR = {
  Exam: "text-terracotta",
  Deadline: "text-brass",
  Assignment: "text-slateblue",
  Holiday: "text-sage"
};

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function AcademicsWidget() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const base = SOURCES.academics.base;

  async function load() {
    try {
      const data = await fetchJson(`${base}/api/calendar/upcoming?limit=5`);
      setItems(data.items);
      setError(null);
    } catch {
      setError("Academics server unreachable");
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ModuleCard
      title="Academics"
      eyebrow="Calendar · Handbook"
      accent="slateblue"
      status={
        error
          ? { label: "Offline", title: "Could not reach academics server" }
          : { label: "Live", title: "Updates every 60s" }
      }
    >
      {error ? (
        <p className="text-sm text-ink/60 italic">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id} className="text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium leading-snug">{item.title}</span>
                <span className="font-mono text-xs text-ink/50 shrink-0">{formatDate(item.date)}</span>
              </div>
              <span className={`font-mono text-[10px] uppercase tracking-wider ${CATEGORY_COLOR[item.category] || "text-ink/50"}`}>
                {item.category}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ModuleCard>
  );
}
