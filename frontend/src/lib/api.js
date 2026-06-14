// Central place for backend / MCP server REST base URLs.
// In production these would point at deployed services (Render/Railway/Vercel).

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export const SOURCES = {
  library: {
    name: "Library",
    base: import.meta.env.VITE_LIBRARY_URL || "http://localhost:4101",
    accent: "sage"
  },
  cafeteria: {
    name: "Cafeteria",
    base: import.meta.env.VITE_CAFETERIA_URL || "http://localhost:4102",
    accent: "terracotta"
  },
  events: {
    name: "Events",
    base: import.meta.env.VITE_EVENTS_URL || "http://localhost:4103",
    accent: "brass"
  },
  academics: {
    name: "Academics",
    base: import.meta.env.VITE_ACADEMICS_URL || "http://localhost:4104",
    accent: "slateblue"
  }
};

export async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}
