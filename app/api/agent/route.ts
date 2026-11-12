import { NextResponse } from "next/server";
import { agentRequestSchema } from "@/lib/schemas";
import { runAgent } from "@/lib/agent/runAgent";
import type { AgentEvent } from "@/lib/agent/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function toError(err: unknown) {
  const message = err instanceof Error ? err.message : "Agent failed";
  console.error("[agent]", message);
  const quota = /429|quota|rate.?limit/i.test(message);
  return {
    status: quota ? 429 : 500,
    message: quota ? "Groq rate limit reached. Wait a minute and try again." : message,
  };
}

/**
 * POST /api/agent  body: { messages: [{ role: "user" | "model", text: string }] }
 * Default: one JSON response. With header `x-agent-stream: 1`: newline-delimited JSON (AgentEvent per line),
 * so the browser can show what the agent is doing while it runs. The last line is "result" or "error".
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = agentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.issues }, { status: 400 });
  }

  if (request.headers.get("x-agent-stream") !== "1") {
    try {
      return NextResponse.json(await runAgent(parsed.data.messages));
    } catch (err) {
      const e = toError(err);
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let open = true;
      const send = (event: AgentEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {
          open = false; // client disconnected
        }
      };
      try {
        const result = await runAgent(parsed.data.messages, send);
        send({ type: "result", reply: result.reply, steps: result.steps });
      } catch (err) {
        const e = toError(err);
        send({ type: "error", message: e.message, status: e.status });
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform" },
  });
}
