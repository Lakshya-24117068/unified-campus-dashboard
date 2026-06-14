import express from "express";
import cors from "cors";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { searchBooks, getBookById, getSeatAvailability, books } from "./data.js";

const PORT = process.env.LIBRARY_MCP_PORT || 4101;

function buildServer() {
  const server = new McpServer({
    name: "campus-library-server",
    version: "1.0.0"
  });

  server.registerTool(
    "search_books",
    {
      title: "Search library catalogue",
      description:
        "Search the campus library catalogue by title, author, category, or ISBN. " +
        "Returns matching books with availability, shelf location, and due dates for borrowed copies.",
      inputSchema: {
        query: z.string().describe("Search term: book title, author name, subject/category, or ISBN")
      }
    },
    async ({ query }) => {
      const results = searchBooks(query);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ count: results.length, books: results }, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "get_book_availability",
    {
      title: "Get book availability",
      description:
        "Look up real-time availability for a specific book by its library ID or ISBN, " +
        "including how many copies are available and the expected return date if all copies are checked out.",
      inputSchema: {
        bookId: z.string().describe("The library book ID (e.g. BK-1001) or ISBN")
      }
    },
    async ({ bookId }) => {
      const book = getBookById(bookId);
      if (!book) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: "Book not found", bookId }) }]
        };
      }
      return { content: [{ type: "text", text: JSON.stringify(book, null, 2) }] };
    }
  );

  server.registerTool(
    "get_reading_room_seats",
    {
      title: "Get reading room seat availability",
      description:
        "Get current seat availability across all library reading rooms and study halls, " +
        "including total seats, occupied seats, and free seats per hall.",
      inputSchema: {}
    },
    async () => {
      const halls = getSeatAvailability();
      return { content: [{ type: "text", text: JSON.stringify({ halls }, null, 2) }] };
    }
  );

  return server;
}

const app = express();
app.use(cors());
app.use(express.json());

// MCP endpoint (stateless: a fresh server+transport per request)
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
    console.error("Library MCP error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null
      });
    }
  }
});

// --- Plain REST endpoints (used directly by the dashboard widgets) ---
app.get("/api/health", (_req, res) => res.json({ status: "ok", server: "library" }));

app.get("/api/books", (req, res) => {
  const { q } = req.query;
  res.json({ count: searchBooks(q).length, books: searchBooks(q) });
});

app.get("/api/books/:id", (req, res) => {
  const book = getBookById(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });
  res.json(book);
});

app.get("/api/seats", (_req, res) => {
  res.json({ halls: getSeatAvailability() });
});

app.get("/api/catalogue-size", (_req, res) => {
  res.json({ totalTitles: books.length });
});

app.listen(PORT, () => {
  console.log(`Library MCP server listening on port ${PORT}`);
  console.log(`  MCP endpoint:  http://localhost:${PORT}/mcp`);
  console.log(`  REST endpoint: http://localhost:${PORT}/api/*`);
});
