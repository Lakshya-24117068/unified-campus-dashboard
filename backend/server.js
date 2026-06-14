import "dotenv/config";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { CampusMcpManager } from "./mcpManager.js";

const PORT = process.env.PORT || 4000;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const mcpManager = new CampusMcpManager([
  { id: "library", name: "Library", url: process.env.LIBRARY_MCP_URL || "http://localhost:4101/mcp" },
  { id: "cafeteria", name: "Cafeteria", url: process.env.CAFETERIA_MCP_URL || "http://localhost:4102/mcp" },
  { id: "events", name: "Events", url: process.env.EVENTS_MCP_URL || "http://localhost:4103/mcp" },
  { id: "academics", name: "Academics", url: process.env.ACADEMICS_MCP_URL || "http://localhost:4104/mcp" }
]);

const SYSTEM_PROMPT = `You are the Campus Intelligence Assistant, embedded in a unified student dashboard.

You have access to tools from several INDEPENDENT campus data sources, each backed by its own MCP server:
- Library: book catalogue, availability, reading room seat occupancy
- Cafeteria: daily/weekly menus, operating hours, live crowd levels
- Events: club events, tech fest schedule, registration deadlines
- Academics: course schedules, academic calendar/deadlines, handbook policies

Guidelines:
- Always call the relevant tool(s) to get real-time data rather than guessing.
- For broad questions, you may need to call tools from multiple sources and combine the results into one coherent answer.
- Be concise and actionable. Use bullet points or short tables when listing multiple items.
- When you mention a source's data (e.g. "the library says..."), make it clear which system it came from.
- If a tool returns an error or "not found", say so plainly rather than inventing data.
- Today's date context should be inferred from tool results (each server returns a "today" field where relevant).
- Do not fabricate book titles, event names, menu items, or policy text — only use what tools return.`;

async function runAssistant(userMessage, conversationHistory = []) {
  const tools = mcpManager.getAnthropicTools();

  const messages = [
    ...conversationHistory,
    { role: "user", content: userMessage }
  ];

  const toolCallLog = [];
  let finalText = "";

  // Agentic loop: keep calling Claude until it stops requesting tools
  for (let turn = 0; turn < 6; turn++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      tools,
      messages
    });

    const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
    const textBlocks = response.content.filter((b) => b.type === "text");

    finalText = textBlocks.map((b) => b.text).join("\n").trim() || finalText;

    if (toolUseBlocks.length === 0) {
      break;
    }

    // Record assistant turn (including tool_use blocks) in history
    messages.push({ role: "assistant", content: response.content });

    // Execute each requested tool call against the right MCP server
    const toolResults = [];
    for (const block of toolUseBlocks) {
      let resultText;
      let serverName = "unknown";
      try {
        const result = await mcpManager.callTool(block.name, block.input);
        resultText = result.text;
        serverName = result.serverName;
      } catch (err) {
        resultText = JSON.stringify({ error: err.message });
      }

      toolCallLog.push({
        tool: block.name,
        server: serverName,
        input: block.input,
        output: safeJsonPreview(resultText)
      });

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: resultText
      });
    }

    messages.push({ role: "user", content: toolResults });

    if (turn === 5) {
      finalText = finalText || "I gathered the data but ran out of reasoning turns — please try rephrasing your question.";
    }
  }

  return { text: finalText, toolCalls: toolCallLog, messages };
}

function safeJsonPreview(text) {
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch {
    return text;
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", mcpServers: mcpManager.getStatus() });
});

app.get("/api/tools", (_req, res) => {
  res.json({ tools: mcpManager.getAnthropicTools().map((t) => ({ name: t.name, description: t.description })) });
});

// Stateless single-turn chat — frontend keeps and resends history for context
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing 'message' string in request body" });
  }

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "your_anthropic_api_key_here") {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY is not configured on the server. Set it in backend/.env"
    });
  }

  try {
    const cleanHistory = Array.isArray(history)
      ? history.filter((m) => m.role === "user" || m.role === "assistant")
      : [];

    const { text, toolCalls, messages } = await runAssistant(message, cleanHistory);

    // Build a trimmed history to return to the client (text-only, to keep payloads small)
    const newHistory = [
      ...cleanHistory,
      { role: "user", content: message },
      { role: "assistant", content: text }
    ];

    res.json({ reply: text, toolCalls, history: newHistory, rawTurnCount: messages.length });
  } catch (err) {
    console.error("Assistant error:", err);
    res.status(500).json({ error: "Assistant failed to process the request", details: err.message });
  }
});

async function start() {
  await mcpManager.connectAll();
  app.listen(PORT, () => {
    console.log(`\nCampus Intelligence backend listening on port ${PORT}`);
    console.log(`  Chat endpoint:   POST http://localhost:${PORT}/api/chat`);
    console.log(`  Health endpoint: GET  http://localhost:${PORT}/api/health`);
    console.log(`  Tools endpoint:  GET  http://localhost:${PORT}/api/tools\n`);
  });
}

start();
