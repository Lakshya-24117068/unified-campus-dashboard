import { useEffect, useRef, useState } from "react";
import { BACKEND_URL } from "../lib/api";

const SOURCE_COLOR = {
  Library: "text-sage border-sage",
  Cafeteria: "text-terracotta border-terracotta",
  Events: "text-brass border-brass",
  Academics: "text-slateblue border-slateblue"
};

const SUGGESTIONS = [
  "Is Deep Learning by Goodfellow available right now?",
  "What's for lunch today and how crowded is the mess?",
  "What workshops are happening this week?",
  "When is my CS412 assignment due and what's the attendance policy?"
];

export default function AssistantPanel() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Good day. I'm the Campus Intelligence Assistant — ask me about the library, cafeteria, club events, or academics and I'll pull live answers from each source.",
      toolCalls: []
    }
  ]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function send(text) {
    const userMessage = text.trim();
    if (!userMessage || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history })
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = [data.error, data.details].filter(Boolean).join(" — ");
        throw new Error(msg || `Server error ${res.status}`);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, toolCalls: data.toolCalls || [] }
      ]);
      setHistory(data.history || []);
    } catch (e) {
      const serverMsg = e.message && e.message !== "Failed to fetch" ? e.message : null;
      setError(serverMsg || "Cannot reach backend");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: serverMsg
            ? `Backend error: ${serverMsg}`
            : "I couldn't reach the assistant backend. Make sure the orchestrator server is running and GOOGLE_API_KEY is set in backend/.env.",
          toolCalls: [],
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="module-card rounded-sm overflow-hidden flex flex-col h-full">
      <div className="px-5 pt-5 pb-3 pl-7 flex items-center justify-between gap-3 border-b border-cardline">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass mb-1">
            Ask Anything · Campus-Wide
          </p>
          <h2 className="font-display text-xl font-semibold leading-snug">AI Assistant</h2>
        </div>
        <span className="stamp text-brass font-mono text-[10px] uppercase px-2 py-1 whitespace-nowrap">
          {loading ? "Routing…" : "Ready"}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pl-7 py-4 space-y-4 scrollbar-thin min-h-[260px] max-h-[480px]">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] rounded-sm px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-ink text-parchment"
                  : m.isError
                  ? "bg-terracotta/10 border border-terracotta/30 text-ink"
                  : "bg-parchment2 border border-cardline text-ink"
              }`}
            >
              {m.content}
              {m.toolCalls && m.toolCalls.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-cardline/70 flex flex-wrap gap-1.5">
                  {m.toolCalls.map((tc, j) => (
                    <span
                      key={j}
                      className={`font-mono text-[10px] uppercase tracking-wider border rounded-sm px-1.5 py-0.5 ${
                        SOURCE_COLOR[tc.server] || "text-ink/50 border-ink/30"
                      }`}
                      title={JSON.stringify(tc.input)}
                    >
                      {tc.server} → {tc.tool.split("__")[1]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-parchment2 border border-cardline rounded-sm px-3.5 py-2.5 text-sm text-ink/50 font-mono">
              querying campus servers
              <span className="caret-blink">_</span>
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="px-5 pl-7 pb-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs font-mono border border-cardline rounded-sm px-2 py-1 text-ink/60 hover:border-brass hover:text-brass transition-colors text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-cardline px-5 pl-7 py-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about library, food, events, academics…"
          className="flex-1 text-sm bg-white border border-cardline rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brass"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="font-mono text-sm uppercase tracking-wider px-4 py-2 bg-ink text-parchment rounded-sm hover:bg-ink/90 transition-colors disabled:opacity-40"
        >
          Send
        </button>
      </form>
      {error && <p className="px-5 pl-7 pb-3 text-xs text-terracotta font-mono">{error}</p>}
    </section>
  );
}
