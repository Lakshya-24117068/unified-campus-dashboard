import express from "express";
import cors from "cors";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  getAllEvents,
  getUpcomingEvents,
  getTodayEvents,
  searchEvents,
  getEventById,
  TODAY
} from "./data.js";

const PORT = process.env.EVENTS_MCP_PORT || 4103;

function buildServer() {
  const server = new McpServer({
    name: "campus-events-server",
    version: "1.0.0"
  });

  server.registerTool(
    "search_events",
    {
      title: "Search campus events",
      description:
        "Search across all club and campus events by keyword (title, club name, category, " +
        "description, or tags). Returns matching events with date, time, venue, and registration links.",
      inputSchema: {
        query: z.string().describe("Keyword to search for, e.g. 'robotics', 'hackathon', 'workshop'")
      }
    },
    async ({ query }) => {
      const results = searchEvents(query);
      return { content: [{ type: "text", text: JSON.stringify({ count: results.length, events: results }, null, 2) }] };
    }
  );

  server.registerTool(
    "get_upcoming_events",
    {
      title: "Get upcoming campus events",
      description: "Get a list of upcoming campus events sorted by date, optionally limited to N results.",
      inputSchema: {
        limit: z.number().int().positive().optional().describe("Maximum number of events to return")
      }
    },
    async ({ limit }) => {
      const results = getUpcomingEvents(limit);
      return { content: [{ type: "text", text: JSON.stringify({ today: TODAY, count: results.length, events: results }, null, 2) }] };
    }
  );

  server.registerTool(
    "get_today_events",
    {
      title: "Get today's campus events",
      description: "Get all campus events scheduled for today, sorted by start time.",
      inputSchema: {}
    },
    async () => {
      const results = getTodayEvents();
      return { content: [{ type: "text", text: JSON.stringify({ today: TODAY, count: results.length, events: results }, null, 2) }] };
    }
  );

  server.registerTool(
    "get_event_details",
    {
      title: "Get event details",
      description: "Get full details for a single event by its event ID.",
      inputSchema: {
        eventId: z.string().describe("The event ID, e.g. EVT-002")
      }
    },
    async ({ eventId }) => {
      const event = getEventById(eventId);
      if (!event) {
        return { content: [{ type: "text", text: JSON.stringify({ error: "Event not found", eventId }) }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(event, null, 2) }] };
    }
  );

  return server;
}

const app = express();
app.use(cors());
app.use(express.json());

app.post("/mcp", async (req, res) => {
  try {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("Events MCP error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null
      });
    }
  }
});

// --- Plain REST endpoints for the dashboard widgets ---
app.get("/api/health", (_req, res) => res.json({ status: "ok", server: "events" }));

app.get("/api/events", (_req, res) => res.json({ today: TODAY, events: getAllEvents() }));

app.get("/api/events/upcoming", (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
  res.json({ today: TODAY, events: getUpcomingEvents(limit) });
});

app.get("/api/events/today", (_req, res) => {
  res.json({ today: TODAY, events: getTodayEvents() });
});

app.get("/api/events/:id", (req, res) => {
  const event = getEventById(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  res.json(event);
});

app.listen(PORT, () => {
  console.log(`Events MCP server listening on port ${PORT}`);
  console.log(`  MCP endpoint:  http://localhost:${PORT}/mcp`);
  console.log(`  REST endpoint: http://localhost:${PORT}/api/*`);
});
