// Mock data standing in for scattered club/event Google Calendars.
// In production, each club's calendar would be polled via the Google Calendar API.

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Anchor date kept relative so the demo always looks "live".
const TODAY = new Date().toISOString().slice(0, 10);

export const events = [
  {
    id: "EVT-001",
    title: "TechFest 2026 — Opening Keynote",
    club: "IEEE Student Chapter",
    category: "Tech Fest",
    date: addDays(TODAY, 1),
    time: "10:00",
    durationMinutes: 90,
    venue: "Main Auditorium",
    description: "Kickoff keynote on AI in robotics, followed by sponsor showcase.",
    registrationLink: "https://forms.example.edu/techfest-keynote",
    tags: ["AI", "Robotics", "Keynote"]
  },
  {
    id: "EVT-002",
    title: "Hands-on Workshop: Build Your First MCP Server",
    club: "ACM Coding Club",
    category: "Workshop",
    date: addDays(TODAY, 1),
    time: "14:00",
    durationMinutes: 120,
    venue: "CS Lab 3, Block C",
    description: "Beginner-friendly workshop on Model Context Protocol servers with Node.js.",
    registrationLink: "https://forms.example.edu/mcp-workshop",
    tags: ["Workshop", "MCP", "Coding"]
  },
  {
    id: "EVT-003",
    title: "Robotics Club Weekly Build Session",
    club: "Robotics Club",
    category: "Club Meeting",
    date: addDays(TODAY, 2),
    time: "17:00",
    durationMinutes: 90,
    venue: "Robotics Lab, Block D",
    description: "Open build session for the autonomous rover team. All skill levels welcome.",
    registrationLink: null,
    tags: ["Robotics", "Hands-on"]
  },
  {
    id: "EVT-004",
    title: "Inter-College Hackathon — Team Registration Deadline",
    club: "Mars Rover Club",
    category: "Deadline",
    date: addDays(TODAY, 3),
    time: "23:59",
    durationMinutes: 0,
    venue: "Online",
    description: "Last date to register a team of up to 4 for the 24-hour hackathon.",
    registrationLink: "https://forms.example.edu/hackathon-register",
    tags: ["Hackathon", "Deadline"]
  },
  {
    id: "EVT-005",
    title: "Open Mic Night",
    club: "Cultural Committee",
    category: "Cultural",
    date: addDays(TODAY, 4),
    time: "19:00",
    durationMinutes: 120,
    venue: "Amphitheatre",
    description: "Music, poetry, and stand-up comedy. Sign-ups at the entrance.",
    registrationLink: null,
    tags: ["Music", "Culture", "Open Mic"]
  },
  {
    id: "EVT-006",
    title: "Career Fair — Core Engineering & IT Companies",
    club: "Training & Placement Cell",
    category: "Career",
    date: addDays(TODAY, 5),
    time: "09:30",
    durationMinutes: 360,
    venue: "Sports Complex",
    description: "20+ companies across core engineering and IT sectors. Bring printed resumes.",
    registrationLink: "https://forms.example.edu/career-fair",
    tags: ["Placement", "Career"]
  },
  {
    id: "EVT-007",
    title: "AI/ML Reading Group: Attention Is All You Need",
    club: "AI Research Club",
    category: "Reading Group",
    date: addDays(TODAY, 0),
    time: "18:30",
    durationMinutes: 60,
    venue: "Seminar Hall 2",
    description: "Weekly paper discussion. This week: the original Transformer paper.",
    registrationLink: null,
    tags: ["AI", "ML", "Reading Group"]
  },
  {
    id: "EVT-008",
    title: "TechFest 2026 — Robotics Showdown Finals",
    club: "Robotics Club",
    category: "Tech Fest",
    date: addDays(TODAY, 6),
    time: "11:00",
    durationMinutes: 180,
    venue: "Main Ground",
    description: "Final round of the autonomous bot combat competition.",
    registrationLink: "https://forms.example.edu/robotics-showdown",
    tags: ["Robotics", "Competition", "Tech Fest"]
  }
];

export function getAllEvents() {
  return events;
}

export function getUpcomingEvents(limit) {
  const sorted = [...events]
    .filter((e) => e.date >= TODAY)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return limit ? sorted.slice(0, limit) : sorted;
}

export function getTodayEvents() {
  return events.filter((e) => e.date === TODAY).sort((a, b) => a.time.localeCompare(b.time));
}

export function searchEvents(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return events;
  return events.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.club.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function getEventById(id) {
  return events.find((e) => e.id === id) || null;
}

export { TODAY };
