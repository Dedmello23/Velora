"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentEvent, AgentStep } from "@/lib/agent/types";
import { statusFor } from "./agentStatus";
import ReplyText from "./ReplyText";
import {
  Send,
  Bot,
  ChevronDown,
  ChevronRight,
  Database,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

type Message = { role: "user" | "model"; text: string; steps?: AgentStep[] };

const SAMPLE_PROMPTS = [
  "Where is my order 1003?",
  "I want to return the shoes from my last order, they are too small.",
  "My order is 4 days late and nobody is answering.",
];

export default function AgentChat({ onDataChanged }: { onDataChanged?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const prefillDone = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, status]);

  // Deep links like /?q=Where+is+my+order+1003 start the conversation with that question.
  useEffect(() => {
    if (prefillDone.current) return;
    prefillDone.current = true;
    const q = new URLSearchParams(window.location.search).get("q");
    if (!q) return;
    window.history.replaceState(null, "", window.location.pathname);
    send(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Message[] = [...messages, { role: "user", text: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError("");
    setStatus("Reading your request");
    const push = (event: AgentEvent) => setStatus((prev) => statusFor(event) ?? prev);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-agent-stream": "1" },
        // Only the last 20 messages are sent, to keep requests small.
        body: JSON.stringify({
          messages: next.slice(-20).map(({ role, text }) => ({ role, text })),
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Request failed");
      }

      // The server sends one JSON event per line while the agent runs; the last one is "result" or "error".
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let final: AgentEvent | null = null;
      const handleLine = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line) as AgentEvent;
        push(event);
        if (event.type === "result" || event.type === "error") final = event;
      };
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        lines.forEach(handleLine);
      }
      handleLine(buffer);

      const end = final as AgentEvent | null;
      if (!end) {
        push({ type: "error", message: "The connection ended before the agent finished.", status: 500 });
        throw new Error("The connection ended before the agent finished.");
      }
      if (end.type === "error") throw new Error(end.message);
      if (end.type !== "result") throw new Error("Unexpected response");
      setMessages([...next, { role: "model", text: end.reply, steps: end.steps }]);
      if (end.steps.some((s) => s.writes && s.ok)) onDataChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden h-[calc(100dvh-5.5rem)] md:h-[calc(100vh-8.5rem)] min-h-[440px] transition-colors">
      {/* Chat Sub-header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 px-3.5 py-2.5 sm:px-6 sm:py-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-2xs">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              ShopEase Assistant
            </h2>
            <p className="hidden text-xs text-zinc-500 sm:block">
              Orders, returns and support
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              title="Reset Chat"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium leading-none text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-3.5 overflow-y-auto p-3 sm:p-5 break-words min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center py-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 mb-3">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
              How can I help today?
            </h3>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed px-2">
              Track live orders, request eligible product returns, or escalate delayed shipments.
            </p>

            <div className="mt-4 w-full space-y-1.5">
              {SAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  className="w-full text-left rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-3 text-[13px] text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors flex items-center justify-between gap-2 group"
                >
                  <span className="line-clamp-2">{p}</span>
                  <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 ${
              m.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {m.role === "model" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                <Bot className="h-4 w-4" />
              </div>
            )}

            {/* Bubble Container */}
            <div
              className={`space-y-1.5 ${
                m.role === "user"
                  ? "max-w-[85%] sm:max-w-[75%]"
                  : "max-w-[92%] sm:max-w-[80%]"
              }`}
            >
              {m.steps && m.steps.length > 0 && <ToolSteps steps={m.steps} />}

              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-zinc-900 dark:bg-indigo-600 text-white rounded-br-md"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-bl-md whitespace-pre-wrap"
                }`}
              >
                {m.role === "model" ? <ReplyText text={m.text} /> : m.text}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 text-[13px] text-zinc-600 dark:text-zinc-300">
              <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-zinc-400" />
              <span>{status || "Working on it"}...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested Quick Prompt Chips (Zero scrollbar, clean momentum touch) */}
      {messages.length > 0 && (
      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 px-3 py-1.5 text-xs shrink-0">
        <span className="flex items-center gap-1 font-semibold text-zinc-400 text-[10px] shrink-0 uppercase tracking-wider">
          Try:
        </span>
        {SAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            disabled={loading}
            onClick={() => send(p)}
            className="min-h-[30px] shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 active:bg-zinc-100 dark:active:bg-zinc-700 disabled:opacity-50 transition-all shadow-2xs whitespace-nowrap"
          >
            {p}
          </button>
        ))}
      </div>
      )}

      {/* Input Box Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 sm:p-3.5 shrink-0"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message ShopEase Assistant"
          className="min-h-[44px] flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-300 focus:bg-white dark:focus:bg-zinc-800/80 transition-all"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-white px-3 sm:px-4 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-95 disabled:opacity-40 transition-all"
        >
          <span className="hidden sm:inline">Send</span>
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

/** Modern Tool Steps Accordion with clean dark mode */
function ToolSteps({ steps }: { steps: AgentStep[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-1.5 my-1">
      {steps.map((s, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800 overflow-hidden text-xs"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between p-2 sm:p-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold ${
                    s.ok
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                  }`}
                >
                  {s.ok ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {s.ok ? "Executed" : "Failed"}
                </span>

                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 text-[11px]">
                  {s.tool}
                </span>

                {s.writes && (
                  <span className="flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/50 px-1 py-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <Database className="h-2 w-2" />
                    WRITES DB
                  </span>
                )}
              </div>

              <ChevronDown
                className={`h-3 w-3 text-zinc-400 transition-transform ${
                  isOpen ? "rotate-180 text-zinc-800 dark:text-zinc-200" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/80 p-2.5 sm:p-3">
                <div className="mb-1 text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Parameters & Result
                </div>
                <pre className="max-h-48 overflow-x-auto whitespace-pre-wrap rounded-lg bg-zinc-900 dark:bg-black p-2 text-[10px] font-mono text-zinc-100 shadow-inner">
                  {JSON.stringify(
                    { args: s.args, ...(s.ok ? { result: s.result } : { error: s.error }) },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
