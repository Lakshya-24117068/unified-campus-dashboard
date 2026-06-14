import { useEffect, useState } from "react";
import { fetchJson, SOURCES } from "../lib/api";
import ModuleCard from "./ModuleCard";

export default function LibraryWidget() {
  const [seats, setSeats] = useState(null);
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);
  const base = SOURCES.library.base;

  async function loadSeats() {
    try {
      const data = await fetchJson(`${base}/api/seats`);
      setSeats(data.halls);
      setError(null);
    } catch (e) {
      setError("Library server unreachable");
    }
  }

  async function loadBooks(q = "") {
    try {
      const data = await fetchJson(`${base}/api/books?q=${encodeURIComponent(q)}`);
      setBooks(data.books.slice(0, 5));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadSeats();
    loadBooks();
    const interval = setInterval(loadSeats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ModuleCard
      title="Library"
      eyebrow="Catalogue · Seats"
      accent="sage"
      status={
        error
          ? { label: "Offline", title: "Could not reach library server" }
          : { label: "Live", title: "Updates every 30s" }
      }
    >
      {error ? (
        <p className="text-sm text-ink/60 italic">{error}</p>
      ) : (
        <>
          <div className="mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50 mb-2">
              Reading room seats
            </p>
            <div className="space-y-1.5">
              {seats === null && <p className="text-sm text-ink/50">Loading…</p>}
              {seats?.map((h) => {
                const pct = Math.round((h.availableSeats / h.totalSeats) * 100);
                return (
                  <div key={h.id} className="text-sm">
                    <div className="flex justify-between mb-0.5">
                      <span>{h.name}</span>
                      <span className="font-mono text-xs text-ink/60">
                        {h.availableSeats}/{h.totalSeats} free
                      </span>
                    </div>
                    <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sage rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50 mb-2">
              Quick catalogue search
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadBooks(query);
              }}
              className="flex gap-2 mb-3"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Title, author, ISBN…"
                className="flex-1 text-sm bg-white border border-cardline rounded-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sage"
              />
              <button
                type="submit"
                className="text-sm font-mono uppercase tracking-wider px-3 py-1.5 border border-sage text-sage rounded-sm hover:bg-sage hover:text-white transition-colors"
              >
                Go
              </button>
            </form>
            <ul className="space-y-1.5 text-sm">
              {books.map((b) => (
                <li key={b.id} className="flex justify-between gap-2">
                  <span className="truncate">{b.title}</span>
                  <span
                    className={`font-mono text-xs shrink-0 ${
                      b.availableCopies > 0 ? "text-sage" : "text-terracotta"
                    }`}
                  >
                    {b.availableCopies > 0 ? `${b.availableCopies} avail.` : "checked out"}
                  </span>
                </li>
              ))}
              {books.length === 0 && <li className="text-ink/40 italic">No results yet</li>}
            </ul>
          </div>
        </>
      )}
    </ModuleCard>
  );
}
