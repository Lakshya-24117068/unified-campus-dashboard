import { useEffect, useState } from "react";
import { fetchJson, SOURCES } from "../lib/api";
import ModuleCard from "./ModuleCard";

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function EventsWidget() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const base = SOURCES.events.base;

  async function load() {
    try {
      const data = await fetchJson(`${base}/api/events/upcoming?limit=5`);
      setEvents(data.events);
      setError(null);
    } catch {
      setError("Events server unreachable");
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ModuleCard
      title="Events & Calendars"
      eyebrow="Clubs · Tech Fest"
      accent="brass"
      status={
        error
          ? { label: "Offline", title: "Could not reach events server" }
          : { label: "Live", title: "Updates every 60s" }
      }
    >
      {error ? (
        <p className="text-sm text-ink/60 italic">{error}</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="flex gap-3">
              <div className="font-mono text-xs text-brass shrink-0 w-16 pt-0.5 text-right">
                {formatDate(e.date)}
                <br />
                {e.time}
              </div>
              <div className="border-l border-cardline pl-3 flex-1">
                <p className="text-sm font-medium leading-snug">{e.title}</p>
                <p className="text-xs text-ink/50 mt-0.5">
                  {e.club} · {e.venue}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ModuleCard>
  );
}
