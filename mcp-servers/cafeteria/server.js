import express from "express";
import cors from "cors";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  getMenu,
  getFullWeekMenu,
  getOperatingHours,
  getCrowdLevels,
  getCurrentMealSlot,
  messHalls
} from "./data.js";

const PORT = process.env.CAFETERIA_MCP_PORT || 4102;

function buildServer() {
  const server = new McpServer({
    name: "campus-cafeteria-server",
    version: "1.0.0"
  });

  server.registerTool(
    "get_menu",
    {
      title: "Get cafeteria menu",
      description:
        "Get the cafeteria menu for a given day of the week (breakfast, lunch, snacks, dinner). " +
        "If no day is given, returns today's menu.",
      inputSchema: {
        day: z
          .string()
          .optional()
          .describe("Day of the week, e.g. 'Monday'. Defaults to today if omitted.")
      }
    },
    async ({ day }) => {
      const result = getMenu(day);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    "get_week_menu",
    {
      title: "Get full weekly cafeteria menu",
      description: "Get the complete cafeteria menu for every day of the week.",
      inputSchema: {}
    },
    async () => {
      return { content: [{ type: "text", text: JSON.stringify(getFullWeekMenu(), null, 2) }] };
    }
  );

  server.registerTool(
    "get_operating_hours",
    {
      title: "Get cafeteria operating hours",
      description:
        "Get the operating hours (breakfast/lunch/snacks/dinner windows) for campus food outlets. " +
        "Optionally filter by mess/food outlet ID.",
      inputSchema: {
        messId: z
          .string()
          .optional()
          .describe("Optional outlet ID (e.g. MESS-1, MESS-2, CAFE-1). Returns all outlets if omitted.")
      }
    },
    async ({ messId }) => {
      const hours = getOperatingHours(messId);
      return { content: [{ type: "text", text: JSON.stringify({ outlets: messHalls, hours }, null, 2) }] };
    }
  );

  server.registerTool(
    "get_crowd_status",
    {
      title: "Get cafeteria crowd status",
      description:
        "Get current crowd levels and estimated wait times at each campus food outlet, " +
        "along with the currently active meal slot (breakfast/lunch/snacks/dinner/closed).",
      inputSchema: {}
    },
    async () => {
      const result = { currentSlot: getCurrentMealSlot(), outlets: getCrowdLevels() };
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
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
    console.error("Cafeteria MCP error:", err);
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
app.get("/api/health", (_req, res) => res.json({ status: "ok", server: "cafeteria" }));

app.get("/api/menu", (req, res) => {
  res.json(getMenu(req.query.day));
});

app.get("/api/menu/week", (_req, res) => {
  res.json(getFullWeekMenu());
});

app.get("/api/hours", (req, res) => {
  res.json({ outlets: messHalls, hours: getOperatingHours(req.query.messId) });
});

app.get("/api/crowd", (_req, res) => {
  res.json({ currentSlot: getCurrentMealSlot(), outlets: getCrowdLevels() });
});

app.listen(PORT, () => {
  console.log(`Cafeteria MCP server listening on port ${PORT}`);
  console.log(`  MCP endpoint:  http://localhost:${PORT}/mcp`);
  console.log(`  REST endpoint: http://localhost:${PORT}/api/*`);
});
