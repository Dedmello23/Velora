"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentEvent, AgentStep } from "@/lib/agent/types";
import { statusFor } from "./agentStatus";
import ReplyText from "./ReplyText";
import {
  ArrowUp,
  Bot,
  ChevronDown,
  Database,
  CheckCircle2,
  AlertCircle,
  SquarePen,
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Grow the composer with its content (up to the max height), shrink back when cleared.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
  }, [input]);

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
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col sm:h-[calc(100dvh-4rem)]">
      {/* Slim title row */}
      <div className="flex h-11 shrink-0 items-center justify-between px-4 sm:px-6">
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">ShopEase Assistant</span>
        {messages.length > 0 && (
          <button
            onClick={() => {
              setMessages([]);
              setError("");
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <SquarePen className="h-3.5 w-3.5" />
            New chat
          </button>
        )}
      </div>

      {/* Conversation */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 pb-6">
          {messages.length === 0 && !loading ? (
            <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                <Bot className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                How can I help today?
              </h1>
              <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                Track an order, start a return, or escalate a delayed shipment.
              </p>
              <div className="mt-8 grid w-full gap-2 sm:grid-cols-3">
                {SAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left text-[13px] leading-snug text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-7 pt-4">
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl bg-zinc-100 px-4 py-2.5 text-[15px] leading-6 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="space-y-3">
                    {m.steps && m.steps.length > 0 && <ToolSteps steps={m.steps} />}
                    <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-zinc-800 dark:text-zinc-200">
                      <ReplyText text={m.text} />
                    </div>
                  </div>
                )
              )}

              {loading && (
                <div className="flex items-center gap-2.5 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="flex gap-1" aria-hidden>
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </span>
                  <span>{status || "Working on it"}…</span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
          {messages.length === 0 && error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 px-4 pb-3 pt-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-3xl border border-zinc-200 bg-white p-2 pl-5 shadow-sm transition-colors focus-within:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:border-zinc-500"
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Message ShopEase Assistant"
            className="max-h-48 min-h-[36px] flex-1 resize-none self-center bg-transparent py-1.5 text-[15px] leading-6 text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-opacity hover:bg-zinc-700 disabled:opacity-25 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <ArrowUp className="h-[18px] w-[18px]" />
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-zinc-400">
          The assistant can make mistakes. Check important order details.
        </p>
      </div>
    </div>
  );
}

/** Compact record of the tools the agent used; click one to inspect its input and output. */
function ToolSteps({ steps }: { steps: AgentStep[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = openIndex !== null ? steps[openIndex] : null;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {steps.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
              openIndex === i
                ? "border-zinc-400 bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-800"
                : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            }`}
          >
            {s.ok ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span className="font-mono text-zinc-700 dark:text-zinc-200">{s.tool}</span>
            {s.writes && <Database className="h-3 w-3 text-amber-500" aria-label="Writes to database" />}
            <ChevronDown
              className={`h-3 w-3 text-zinc-400 transition-transform ${openIndex === i ? "rotate-180" : ""}`}
            />
          </button>
        ))}
      </div>
      {open && (
        <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-zinc-900 p-3 font-mono text-[11px] leading-relaxed text-zinc-100 dark:bg-black">
          {JSON.stringify(
            { args: open.args, ...(open.ok ? { result: open.result } : { error: open.error }) },
            null,
            2
          )}
        </pre>
      )}
    </div>
  );
}
