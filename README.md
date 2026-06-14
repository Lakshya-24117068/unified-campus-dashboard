# Campus Intelligence — Unified Dashboard with AI Assistant

**MARS Open Projects 2026 · Web Development · Problem Statement 1**

A unified campus dashboard that surfaces live data from four independent
campus systems — **Library**, **Cafeteria**, **Events/Calendars**, and
**Academics** — each behind its own [MCP (Model Context Protocol)](https://modelcontextprotocol.io)
server. An embedded AI Assistant routes natural-language questions to the
right server(s) in real time. There is no shared database: every module
fetches live from its own source.

---

## 1. Architecture

```
campus-dashboard/
├── mcp-servers/
│   ├── library/        MCP server — catalogue, availability, reading-room seats
│   ├── cafeteria/       MCP server — menu, operating hours, live crowd levels
│   ├── events/          MCP server — club events, tech fest, deadlines
│   └── academics/        MCP server — courses, academic calendar, handbook policies
├── backend/              AI Assistant orchestrator (Express + Anthropic SDK)
│   └── connects to all 4 MCP servers, exposes POST /api/chat
└── frontend/             React + Vite + Tailwind dashboard UI
```

Each MCP server is a **standalone Express app** exposing:
- An **MCP endpoint** (`POST /mcp`, Streamable HTTP transport) — used by the AI assistant for tool-calling.
- A set of **plain REST endpoints** (`GET /api/*`) — used directly by the dashboard widgets for fast polling, independent of the AI.

The **backend orchestrator** connects to all four MCP servers as an MCP
client, aggregates their tools into a single namespaced tool list (e.g.
`library__search_books`, `cafeteria__get_crowd_status`), and hands that list
to Claude. When a student asks a question, Claude decides which tool(s) from
which server(s) to call, the orchestrator executes them against the live MCP
servers, and Claude composes the final answer — citing which source(s) it
used.

```
                ┌──────────────┐
   Student  ──▶ │   Frontend    │
                │ (React/Vite)  │
                └──────┬───────┘
                       │ REST polling          │ POST /api/chat
        ┌──────────────┼──────────────┐        │
        ▼              ▼              ▼        ▼
   Library MCP   Cafeteria MCP   Events MCP   ┌──────────────┐
   :4101         :4102           :4103        │   Backend     │
        ▲              ▲              ▲       │ Orchestrator  │
        │              │              │       │   :4000       │
        └──────────────┴──────────────┴───────┤  (Claude +    │
                              Academics MCP    │   MCP client) │
                              :4104  ◀─────────└──────────────┘
```

---

## 2. Key Features

- **Independent MCP servers** for library, cafeteria, events, and academics — each with its own mock dataset standing in for a real legacy system (catalogue, weekly PDF menu, Google Calendars, handbook PDFs).
- **AI Assistant** that dynamically routes natural-language queries to one or more MCP servers and synthesizes a single answer, with visible "tool badges" showing exactly which source(s) and tool(s) were used.
- **Unified dashboard UI** — four live widget cards (auto-refreshing every 30–60s) plus a persistent assistant panel, styled as a campus directory board.
- **No giant shared database** — every widget and every assistant answer is fetched live from its respective server.
- Responsive design, down to mobile.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS |
| MCP Servers | Node.js, Express, `@modelcontextprotocol/sdk` (Streamable HTTP) |
| AI Integration | `@anthropic-ai/sdk` (Claude, tool/function-calling) |
| Backend | Node.js, Express |

---

## 4. Setup & Run Locally

### Prerequisites
- Node.js 18+
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com)) for the AI Assistant

### 4.1 Install dependencies

From the project root, install each package separately (each is its own
Node project):

```bash
cd mcp-servers/library    && npm install
cd ../cafeteria            && npm install
cd ../events                && npm install
cd ../academics             && npm install
cd ../../backend             && npm install
cd ../frontend                 && npm install
```

### 4.2 Configure environment variables

**Backend** — copy `backend/.env.example` to `backend/.env` and add your key:

```bash
cd backend
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-...
```

**Frontend** — the defaults in `frontend/.env.example` point at
`localhost` ports and work out of the box for local development. Copy to
`.env` if you need to change them (e.g. for deployment):

```bash
cd frontend
cp .env.example .env
```

### 4.3 Start everything

Open **6 terminals** (or use a process manager like `concurrently` / `pm2`),
one per service:

```bash
# Terminal 1
cd mcp-servers/library && npm start      # http://localhost:4101

# Terminal 2
cd mcp-servers/cafeteria && npm start    # http://localhost:4102

# Terminal 3
cd mcp-servers/events && npm start       # http://localhost:4103

# Terminal 4
cd mcp-servers/academics && npm start    # http://localhost:4104

# Terminal 5 — start AFTER the four MCP servers above are up
cd backend && npm start                  # http://localhost:4000

# Terminal 6
cd frontend && npm run dev               # http://localhost:5173
```

Open **http://localhost:5173** in your browser.

> The backend connects to all four MCP servers on startup and logs how many
> tools it discovered from each. If a server is down, the corresponding
> dashboard widget shows an "Offline" stamp and the assistant simply won't
> have those tools available — the rest of the system keeps working.

---

## 5. Each MCP Server

### Library (`:4101`)
| Tool | Description |
|---|---|
| `search_books` | Search catalogue by title/author/category/ISBN |
| `get_book_availability` | Availability + due date for a specific book |
| `get_reading_room_seats` | Live seat occupancy across study halls |

### Cafeteria (`:4102`)
| Tool | Description |
|---|---|
| `get_menu` | Today's (or a given day's) menu by meal slot |
| `get_week_menu` | Full weekly menu |
| `get_operating_hours` | Mess/outlet operating hours |
| `get_crowd_status` | Live crowd level + wait time per outlet |

### Events (`:4103`)
| Tool | Description |
|---|---|
| `search_events` | Keyword search across club events |
| `get_upcoming_events` | Upcoming events sorted by date |
| `get_today_events` | Today's events |
| `get_event_details` | Full details for one event |

### Academics (`:4104`)
| Tool | Description |
|---|---|
| `search_courses` | Search course catalogue |
| `get_course_schedule` | Weekly schedule for a course |
| `get_upcoming_deadlines` | Upcoming exams/assignments/deadlines |
| `search_academic_calendar` | Keyword search over academic calendar |
| `get_academic_policy` | Handbook policy summaries (attendance, grading, etc.) |

All datasets in this submission are **mocked** (`data.js` in each server)
so the project runs without external accounts. Each `data.js` is isolated
and documents where a real integration would plug in (ILS API, PDF parser +
cron job, Google Calendar API, student information system).

---

## 6. Example Assistant Queries

- "Is *Deep Learning* by Goodfellow available right now?" → Library
- "What's for lunch today and how crowded is the mess?" → Cafeteria
- "What workshops are happening this week?" → Events
- "When is my CS412 assignment due, and what's the attendance policy?" → Academics (multi-tool)
- "I have an hour free — anything happening on campus, and is the library quiet?" → Events + Library (multi-server)

---

## 7. Deployment Notes

- **Frontend**: Vercel / Netlify. Set `VITE_*` env vars to the deployed MCP server and backend URLs.
- **MCP servers & backend**: Render / Railway (or any Node host). Each MCP server and the backend are independent services — deploy separately and point the backend's `*_MCP_URL` env vars at the deployed MCP server URLs.
- CORS is enabled on all servers for simplicity; restrict `origin` in production.

---

## 8. Notice

All data shown (book records, menus, events, courses, policies) is
illustrative mock data created for this submission — not real institutional
data.
