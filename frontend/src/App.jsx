import Header from "./components/Header";
import LibraryWidget from "./components/LibraryWidget";
import CafeteriaWidget from "./components/CafeteriaWidget";
import EventsWidget from "./components/EventsWidget";
import AcademicsWidget from "./components/AcademicsWidget";
import AssistantPanel from "./components/AssistantPanel";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="max-w-[1400px] w-full mx-auto px-5 md:px-8 py-6 md:py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left/center: source modules in a 2x2 grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <LibraryWidget />
            <CafeteriaWidget />
            <EventsWidget />
            <AcademicsWidget />
          </div>

          {/* Right: AI assistant, spans full height */}
          <div className="lg:col-span-1">
            <AssistantPanel />
          </div>
        </div>

        <footer className="mt-8 pt-5 border-t border-cardline flex flex-col sm:flex-row justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40">
          <span>Campus Intelligence Dashboard · MARS Open Projects 2026</span>
          <span>4 independent sources · 0 shared databases</span>
        </footer>
      </main>
    </div>
  );
}
