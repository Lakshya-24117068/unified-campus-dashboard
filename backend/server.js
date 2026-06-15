import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { CampusMcpManager } from "./mcpManager.js";

const PORT = process.env.PORT || 4000;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// v1beta is required — the stable v1 endpoint does NOT support
// systemInstruction or tools in the request body.
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const mcpManager = new CampusMcpManager([
  { id: "library",   name: "Library",   url: process.env.LIBRARY_MCP_URL   || "http://localhost:4101/mcp" },
  { id: "cafeteria", name: "Cafeteria", url: process.env.CAFETERIA_MCP_URL || "http://localhost:4102/mcp" },
  { id: "events",    name: "Events",    url: process.env.EVENTS_MCP_URL    || "http://localhost:4103/mcp" },
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

/**
 * Convert flat history (role/content pairs) into @google/genai Content[] format.
 * Gemini uses "model" instead of "assistant".
 */
function toGeminiHistory(history) {
  return history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }]
  }));
}
/**
 * Retry a Gemini API call up to `maxRetries` times when a 429 rate-limit
 * error is returned. Waits for the retryDelay the API suggests, or falls
 * back to exponential back-off.
 */
async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err?.message?.includes("429") || err?.status === 429 ||
                    err?.message?.includes("RESOURCE_EXHAUSTED");
      // Don't retry daily quota errors (limit: 0 with no retryDelay)
      const isDaily = err?.message?.includes("PerDay");
      if (!is429 || isDaily || attempt === maxRetries) throw err;

      // Extract suggested wait from error message, fallback to 2^attempt * 5s
      const match = err.message?.match(/(\d+(?:\.\d+)?)s/);
      const waitMs = match ? Math.ceil(parseFloat(match[1])) * 1000 + 1000
                           : (2 ** attempt) * 5000;
      console.warn(`[Gemini] 429 received — retrying in ${Math.round(waitMs/1000)}s (attempt ${attempt+1}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

async function runAssistant(userMessage, conversationHistory = []) {
  const toolDeclarations = mcpManager.getGeminiTools();

  const chat = ai.chats.create({
    model: MODEL,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools: toolDeclarations.length > 0
        ? [{ functionDeclarations: toolDeclarations }]
        : []
    },
    history: toGeminiHistory(conversationHistory)
  });

  const toolCallLog = [];
  let finalText = "";

  // Send the initial user message
  let response = await withRetry(() => chat.sendMessage({ message: userMessage }));

  // Agentic loop — keep going until Gemini stops requesting tool calls (max 6 turns)
  for (let turn = 0; turn < 6; turn++) {
    // .text is a getter — may throw if response has no text parts; guard it
    const textContent = (() => { try { return response.text ?? ""; } catch { return ""; } })();
    if (textContent) finalText = textContent;

    // .functionCalls is a getter that returns undefined (not []) when there are none
    const functionCalls = response.functionCalls;
    if (!functionCalls || functionCalls.length === 0) break;

    // Execute every function call against the appropriate MCP server
    const functionResponseParts = [];

    for (const fc of functionCalls) {
      let resultText;
      let serverName = "unknown";

      try {
        const mcpResult = await mcpManager.callTool(fc.name, fc.args || {});
        resultText = mcpResult.text;
        serverName = mcpResult.serverName;
      } catch (err) {
        resultText = JSON.stringify({ error: err.message });
      }

      toolCallLog.push({
        tool:   fc.name,
        server: serverName,
        input:  fc.args || {},
        output: safeJsonPreview(resultText)
      });

      // Build the Part the SDK expects:
      //   { functionResponse: { id, name, response: <plain object> } }
      // The `id` field MUST match the functionCall id for the API to accept it.
      // The `response` value must be a plain object, NOT a raw string.
      functionResponseParts.push({
        functionResponse: {
          id:       fc.id,    // echo back the call id
          name:     fc.name,
          response: { output: resultText }   // wrap text in a plain object
        }
      });
    }

    // Return all tool results to Gemini in a single user turn
    response = await withRetry(() => chat.sendMessage({ message: functionResponseParts }));

    if (turn === 5) {
      const lastText = (() => { try { return response.text ?? ""; } catch { return ""; } })();
      finalText = lastText || finalText || "I gathered the data but ran out of reasoning turns — please try rephrasing your question.";
    }
  }

  return { text: finalText, toolCalls: toolCallLog };
}

function safeJsonPreview(text) {
  try { return JSON.parse(text); } catch { return text; }
}

// ─── Express app ────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", model: MODEL, mcpServers: mcpManager.getStatus() });
});

app.get("/api/tools", (_req, res) => {
  const tools = mcpManager.getGeminiTools().map((t) => ({ name: t.name, description: t.description }));
  res.json({ tools });
});

// Stateless chat — frontend keeps and re-sends history for multi-turn context
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing 'message' string in request body" });
  }

  if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === "your_google_api_key_here") {
    return res.status(500).json({
      error: "GOOGLE_API_KEY is not configured on the server. Set it in backend/.env"
    });
  }

  try {
    const cleanHistory = Array.isArray(history)
      ? history.filter((m) => m.role === "user" || m.role === "assistant")
      : [];

    const { text, toolCalls } = await runAssistant(message, cleanHistory);

    const newHistory = [
      ...cleanHistory,
      { role: "user",      content: message },
      { role: "assistant", content: text }
    ];

    res.json({ reply: text, toolCalls, history: newHistory });
  } catch (err) {
    console.error("Assistant error:", err);
    // Surface the real error message to the frontend to ease debugging
    res.status(500).json({
      error: err.message || "Assistant failed to process the request",
      details: err.stack?.split("\n")[1]?.trim() ?? undefined
    });
  }
});

async function start() {
  await mcpManager.connectAll();
  app.listen(PORT, () => {
    console.log(`\nCampus Intelligence backend listening on port ${PORT}  [model: ${MODEL}]`);
    console.log(`  Chat:   POST http://localhost:${PORT}/api/chat`);
    console.log(`  Health: GET  http://localhost:${PORT}/api/health`);
    console.log(`  Tools:  GET  http://localhost:${PORT}/api/tools\n`);
  });
}

start();
