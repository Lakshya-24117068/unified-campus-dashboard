import { useEffect, useState } from "react";
import { fetchJson, SOURCES } from "../lib/api";
import ModuleCard from "./ModuleCard";

const CROWD_COLOR = {
  Low: "text-sage",
  Medium: "text-brass",
  High: "text-terracotta"
};

const SLOT_LABEL = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snacks: "Snacks",
  dinner: "Dinner",
  closed: "Kitchen Closed"
};

export default function CafeteriaWidget() {
  const [menu, setMenu] = useState(null);
  const [crowd, setCrowd] = useState(null);
  const [error, setError] = useState(null);
  const base = SOURCES.cafeteria.base;

  async function load() {
    try {
      const [menuData, crowdData] = await Promise.all([
        fetchJson(`${base}/api/menu`),
        fetchJson(`${base}/api/crowd`)
      ]);
      setMenu(menuData);
      setCrowd(crowdData);
      setError(null);
    } catch {
      setError("Cafeteria server unreachable");
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentSlot = crowd?.currentSlot || "closed";
  const slotItems = menu?.menu?.[currentSlot] || menu?.menu?.lunch || [];

  return (
    <ModuleCard
      title="Cafeteria"
      eyebrow="Menu · Crowd"
      accent="terracotta"
      status={
        error
          ? { label: "Offline", title: "Could not reach cafeteria server" }
          : { label: "Live", title: "Updates every 30s" }
      }
    >
      {error ? (
        <p className="text-sm text-ink/60 italic">{error}</p>
      ) : !menu ? (
        <p className="text-sm text-ink/50">Loading…</p>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">
                {menu.day} · {SLOT_LABEL[currentSlot]}
              </p>
            </div>
            <ul className="text-sm space-y-1 list-disc list-inside marker:text-terracotta/50">
              {slotItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="mt-auto">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50 mb-2">
              Crowd status
            </p>
            <div className="space-y-1.5 text-sm">
              {crowd?.outlets?.map((o) => (
                <div key={o.id} className="flex items-center justify-between">
                  <span>{o.name}</span>
                  <span className={`font-mono text-xs ${CROWD_COLOR[o.crowdLevel] || "text-ink/50"}`}>
                    {o.crowdLevel}
                    {o.estimatedWaitMinutes > 0 ? ` · ~${o.estimatedWaitMinutes}m wait` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </ModuleCard>
  );
}
