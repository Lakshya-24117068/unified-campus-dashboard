import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * Wraps connections to every independent campus MCP server (library,
 * cafeteria, events, academics) and exposes a single flat tool list +
 * a unified call interface for the AI assistant.
 *
 * Each MCP server is a fully independent process / data source — the
 * dashboard never combines them into one shared database. This manager
 * just keeps a live connection to each and tags every tool with which
 * server it came from, so results can be routed and displayed per-source.
 */
export class CampusMcpManager {
  constructor(serverConfigs) {
    // serverConfigs: [{ id, name, url }]
    this.serverConfigs = serverConfigs;
    this.clients = new Map(); // id -> { client, tools, status }
  }

  async connectAll() {
    await Promise.all(
      this.serverConfigs.map(async (cfg) => {
        try {
          const transport = new StreamableHTTPClientTransport(new URL(cfg.url));
          const client = new Client({ name: "campus-dashboard-orchestrator", version: "1.0.0" });
          await client.connect(transport);

          const toolsResult = await client.listTools();
          const tools = toolsResult.tools.map((t) => ({ ...t, _serverId: cfg.id, _serverName: cfg.name }));

          this.clients.set(cfg.id, { client, tools, status: "connected", url: cfg.url, name: cfg.name });
          console.log(`Connected to ${cfg.name} MCP server (${tools.length} tools) at ${cfg.url}`);
        } catch (err) {
          console.error(`Failed to connect to ${cfg.name} MCP server at ${cfg.url}:`, err.message);
          this.clients.set(cfg.id, { client: null, tools: [], status: "unreachable", url: cfg.url, name: cfg.name });
        }
      })
    );
  }

  /**
   * Convert an MCP JSON Schema to a Gemini-compatible Schema object.
   * Gemini's Schema type is a subset of JSON Schema — it supports
   * type, description, properties, items, enum, and required.
   * Unsupported keywords are silently dropped.
   */
  _mcpSchemaToGemini(schema) {
    if (!schema || typeof schema !== "object") {
      return { type: "object", properties: {} };
    }

    const gemini = {};

    // Map JSON Schema types to Gemini's uppercase type strings
    const typeMap = {
      string:  "STRING",
      number:  "NUMBER",
      integer: "INTEGER",
      boolean: "BOOLEAN",
      array:   "ARRAY",
      object:  "OBJECT"
    };

    if (schema.type) {
      gemini.type = typeMap[schema.type] ?? schema.type.toUpperCase();
    } else {
      gemini.type = "OBJECT";
    }

    if (schema.description) gemini.description = schema.description;
    if (schema.enum)        gemini.enum        = schema.enum;
    if (schema.required)    gemini.required    = schema.required;

    if (schema.properties && typeof schema.properties === "object") {
      gemini.properties = {};
      for (const [key, val] of Object.entries(schema.properties)) {
        gemini.properties[key] = this._mcpSchemaToGemini(val);
      }
    }

    if (schema.items) {
      gemini.items = this._mcpSchemaToGemini(schema.items);
    }

    return gemini;
  }

  /**
   * Returns all tools across all connected servers as Gemini FunctionDeclaration objects.
   * Tool names are namespaced as "<serverId>__<toolName>" to avoid collisions.
   */
  getGeminiTools() {
    const tools = [];
    for (const [serverId, entry] of this.clients) {
      for (const tool of entry.tools) {
        tools.push({
          name: `${serverId}__${tool.name}`,
          description: `[${entry.name}] ${tool.description}`,
          parameters: this._mcpSchemaToGemini(tool.inputSchema || { type: "object", properties: {} })
        });
      }
    }
    return tools;
  }

  /**
   * Returns all tools in Anthropic tool-spec format (kept for backwards
   * compatibility with any callers that have not yet migrated).
   * @deprecated Use getGeminiTools() instead.
   */
  getAnthropicTools() {
    const tools = [];
    for (const [serverId, entry] of this.clients) {
      for (const tool of entry.tools) {
        tools.push({
          name: `${serverId}__${tool.name}`,
          description: `[${entry.name}] ${tool.description}`,
          input_schema: tool.inputSchema || { type: "object", properties: {} }
        });
      }
    }
    return tools;
  }

  /** Find which server a namespaced tool name belongs to, and the real tool name. */
  resolveTool(namespacedName) {
    const idx = namespacedName.indexOf("__");
    if (idx === -1) return null;
    const serverId = namespacedName.slice(0, idx);
    const toolName = namespacedName.slice(idx + 2);
    return { serverId, toolName };
  }

  /** Call a tool on the appropriate MCP server. Returns the raw text content. */
  async callTool(namespacedName, args) {
    const resolved = this.resolveTool(namespacedName);
    if (!resolved) throw new Error(`Invalid tool name: ${namespacedName}`);

    const entry = this.clients.get(resolved.serverId);
    if (!entry || !entry.client) {
      throw new Error(`Server "${resolved.serverId}" is not connected`);
    }

    const result = await entry.client.callTool({ name: resolved.toolName, arguments: args || {} });
    const textParts = (result.content || [])
      .filter((c) => c.type === "text")
      .map((c) => c.text);
    return {
      serverId: resolved.serverId,
      serverName: entry.name,
      toolName: resolved.toolName,
      text: textParts.join("\n")
    };
  }

  getStatus() {
    const status = {};
    for (const [id, entry] of this.clients) {
      status[id] = { name: entry.name, status: entry.status, url: entry.url, toolCount: entry.tools.length };
    }
    return status;
  }
}
