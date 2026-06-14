import express from "express";
import cors from "cors";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  getCourses,
  getCourseByCode,
  searchCourses,
  getUpcomingDeadlines,
  searchCalendar,
  getPolicy,
  getAllPolicies,
  TODAY
} from "./data.js";

const PORT = process.env.ACADEMICS_MCP_PORT || 4104;

function buildServer() {
  const server = new McpServer({
    name: "campus-academics-server",
    version: "1.0.0"
  });

  server.registerTool(
    "search_courses",
    {
      title: "Search courses",
      description:
        "Search the course catalogue by course code, course name, or instructor name. " +
        "Returns matching courses with credits, instructor, weekly schedule, and syllabus highlights.",
      inputSchema: {
        query: z.string().describe("Search term: course code (e.g. CS412), course name, or instructor")
      }
    },
    async ({ query }) => {
      const results = searchCourses(query);
      return { content: [{ type: "text", text: JSON.stringify({ count: results.length, courses: results }, null, 2) }] };
    }
  );

  server.registerTool(
    "get_course_schedule",
    {
      title: "Get course schedule",
      description: "Get the weekly class schedule (days, times, rooms) for a specific course by its course code.",
      inputSchema: {
        courseCode: z.string().describe("The course code, e.g. CS301")
      }
    },
    async ({ courseCode }) => {
      const course = getCourseByCode(courseCode);
      if (!course) {
        return { content: [{ type: "text", text: JSON.stringify({ error: "Course not found", courseCode }) }] };
      }
      return { content: [{ type: "text", text: JSON.stringify(course, null, 2) }] };
    }
  );

  server.registerTool(
    "get_upcoming_deadlines",
    {
      title: "Get upcoming academic deadlines",
      description:
        "Get upcoming academic calendar items: exams, assignment due dates, fee deadlines, and holidays, " +
        "sorted by date.",
      inputSchema: {
        limit: z.number().int().positive().optional().describe("Maximum number of items to return")
      }
    },
    async ({ limit }) => {
      const results = getUpcomingDeadlines(limit);
      return { content: [{ type: "text", text: JSON.stringify({ today: TODAY, count: results.length, items: results }, null, 2) }] };
    }
  );

  server.registerTool(
    "search_academic_calendar",
    {
      title: "Search academic calendar",
      description: "Search the academic calendar (exams, deadlines, holidays) by keyword.",
      inputSchema: {
        query: z.string().describe("Keyword, e.g. 'exam', 'holiday', 'CS412'")
      }
    },
    async ({ query }) => {
      const results = searchCalendar(query);
      return { content: [{ type: "text", text: JSON.stringify({ count: results.length, items: results }, null, 2) }] };
    }
  );

  server.registerTool(
    "get_academic_policy",
    {
      title: "Get academic policy from handbook",
      description:
        "Get a summary of a specific academic policy from the student handbook (e.g. attendance, grading, " +
        "re-examination, leave of absence). If no topic is given, returns all policy summaries.",
      inputSchema: {
        topic: z
          .string()
          .optional()
          .describe("Policy topic, e.g. 'attendance', 'grading', 're-examination', 'leave of absence'")
      }
    },
    async ({ topic }) => {
      const result = topic ? getPolicy(topic) : getAllPolicies();
      if (!result) {
        return { content: [{ type: "text", text: JSON.stringify({ error: "Policy topic not found", topic }) }] };
      }
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
    console.error("Academics MCP error:", err);
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
app.get("/api/health", (_req, res) => res.json({ status: "ok", server: "academics" }));

app.get("/api/courses", (req, res) => {
  const { q } = req.query;
  res.json({ count: searchCourses(q).length, courses: searchCourses(q) });
});

app.get("/api/courses/:code", (req, res) => {
  const course = getCourseByCode(req.params.code);
  if (!course) return res.status(404).json({ error: "Course not found" });
  res.json(course);
});

app.get("/api/calendar/upcoming", (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
  res.json({ today: TODAY, items: getUpcomingDeadlines(limit) });
});

app.get("/api/calendar", (req, res) => {
  res.json({ count: searchCalendar(req.query.q).length, items: searchCalendar(req.query.q) });
});

app.get("/api/policies", (req, res) => {
  const result = req.query.topic ? getPolicy(req.query.topic) : getAllPolicies();
  res.json(result || { error: "Policy topic not found" });
});

app.listen(PORT, () => {
  console.log(`Academics MCP server listening on port ${PORT}`);
  console.log(`  MCP endpoint:  http://localhost:${PORT}/mcp`);
  console.log(`  REST endpoint: http://localhost:${PORT}/api/*`);
});
