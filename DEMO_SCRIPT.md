# Demo Video Script (5–10 minutes)

A suggested walkthrough structure for the screen-recorded demo required by
the submission instructions.

## 1. Intro (30s)
- "This is the Campus Intelligence Dashboard — a unified view of four
  independent campus systems: Library, Cafeteria, Events, and Academics,
  plus an AI assistant that can query all of them live."
- Show the running dashboard at `localhost:5173`.

## 2. Architecture overview (60–90s)
- Briefly show the project structure in the editor:
  - `mcp-servers/library`, `cafeteria`, `events`, `academics` — each an
    independent Express + MCP server with its own mock dataset.
  - `backend` — the orchestrator that connects to all four as an MCP client.
  - `frontend` — the React dashboard.
- Point out: "No giant shared database — each server owns its own data and
  exposes it both as REST (for the widgets) and as MCP tools (for the AI)."
- Show the terminal output when starting all servers: each MCP server logs
  its tool count, and the backend logs `Connected to <X> MCP server (N tools)`.

## 3. Dashboard widgets — live data (90s)
- **Library card**: point out the live reading-room seat bars and run a
  catalogue search (e.g. "deep") to show real-time availability.
- **Cafeteria card**: show today's menu for the current meal slot and the
  live crowd status per outlet.
- **Events card**: show the upcoming events list, sorted by date, sourced
  from the events MCP server.
- **Academics card**: show upcoming deadlines/exams from the academic
  calendar.
- Mention the 30–60s auto-refresh and the "Live" / "Offline" stamps.

## 4. AI Assistant — single-source queries (90s)
- Ask: *"Is Deep Learning by Goodfellow available right now?"*
  - Show the response and the `LIBRARY → SEARCH_BOOKS` / `LIBRARY →
    GET_READING_ROOM_SEATS` tool badges appearing under the answer.
- Ask: *"What's for lunch today and how crowded is the mess?"*
  - Show `CAFETERIA → GET_MENU` / `CAFETERIA → GET_CROWD_STATUS` badges.

## 5. AI Assistant — multi-source query (60s)
- Ask: *"When is my CS412 assignment due, and what's the attendance
  policy?"*
  - Show the assistant calling `ACADEMICS → GET_UPCOMING_DEADLINES` and
    `ACADEMICS → GET_ACADEMIC_POLICY` and combining both into one answer.
- Optionally ask a cross-server question: *"I have an hour free — anything
  happening on campus, and is the library quiet?"* to show
  `EVENTS → GET_UPCOMING_EVENTS` + `LIBRARY → GET_READING_ROOM_SEATS` both
  firing.

## 6. Resilience demo (30–45s, optional but impressive)
- Stop one MCP server (e.g. Cafeteria) in the terminal.
- Refresh the dashboard — show the Cafeteria card now shows "Offline" while
  the other three cards keep updating normally.
- Ask the assistant a cafeteria question — show it gracefully reports it
  can't reach that source rather than fabricating data.
- Restart the server to show it reconnects.

## 7. Mobile / responsive view (15–20s)
- Resize the browser or open dev tools device toolbar to show the
  responsive mobile layout.

## 8. Wrap-up (15–20s)
- Recap: independent MCP servers per data source, AI assistant routes
  queries dynamically, unified live dashboard, no shared database.
- Mention the GitHub repo and README for setup instructions.
