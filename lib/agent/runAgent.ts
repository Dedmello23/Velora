import "server-only";
import Groq from "groq-sdk";
import { getGroq } from "../groq";
import { GROQ_MODEL } from "../env";
import type { ChatMessage } from "../schemas";
import { tools } from "./tools";
import { toToolDefinitions } from "./defineTool";
import { buildSystemPrompt } from "./systemPrompt";
import type { AgentEvent, AgentResult, AgentStep } from "./types";

/** Stops the agent from looping forever and using up your Groq quota. A return needs about 4 tool calls. */
const MAX_ROUNDS = 8;

/** Groq sometimes returns a malformed tool call (HTTP 400, tool_use_failed). Asking again almost always works. */
const MODEL_RETRIES = 2;

type Message = Groq.Chat.ChatCompletionMessageParam;

/**
 * THE AGENT LOOP
 * 1. Send the chat + the tool list to Groq.
 * 2. If the model asks for tools, check the arguments with Zod and run them.
 * 3. Send the results back to the model.
 * 4. Repeat until the model gives a final text answer (or MAX_ROUNDS is reached).
 */
export async function runAgent(
  messages: ChatMessage[],
  onEvent: (event: AgentEvent) => void = () => {}
): Promise<AgentResult> {
  const steps: AgentStep[] = [];
  const toolDefinitions = toToolDefinitions(tools);

  // The browser sends role "model"; Groq calls the same thing "assistant".
  const history: Message[] = [
    { role: "system", content: buildSystemPrompt() },
    ...messages.map((m): Message => ({ role: m.role === "model" ? "assistant" : "user", content: m.text })),
  ];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    onEvent({ type: "model_start", round });
    const response = await askModel(history, toolDefinitions, onEvent);
    const message = response.choices[0]?.message;
    const calls = message?.tool_calls ?? [];

    // No tool requested: this is the final answer.
    if (calls.length === 0) {
      return { reply: message?.content?.trim() || "Sorry, I could not answer that.", steps };
    }

    // Keep the model's own turn (it carries the tool request) in the history.
    // Rebuilt by hand so no extra response fields are sent back to the API.
    history.push({ role: "assistant", content: message?.content ?? "", tool_calls: calls });

    for (const call of calls) {
      const tool = tools.find((t) => t.name === call.function.name);
      onEvent({ type: "tool_start", id: call.id, tool: call.function.name, writes: tool?.writes ?? false });
      const step = await runTool(call.function.name, call.function.arguments);
      onEvent({ type: "tool_end", id: call.id, tool: step.tool, ok: step.ok, error: step.ok ? undefined : step.error });
      steps.push(step);
      history.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(step.ok ? { result: step.result } : { error: step.error }),
      });
    }
  }

  return {
    reply: "I needed too many steps for this request. Please try a simpler or more specific question.",
    steps,
  };
}

async function askModel(
  history: Message[],
  toolDefinitions: ReturnType<typeof toToolDefinitions>,
  onEvent: (event: AgentEvent) => void
) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await getGroq().chat.completions.create({
        model: GROQ_MODEL,
        messages: history,
        tools: toolDefinitions,
        tool_choice: "auto",
        temperature: 0.2,
        max_completion_tokens: 2048,
      });
    } catch (err) {
      if (attempt < MODEL_RETRIES && isBadToolCall(err)) {
        onEvent({ type: "model_retry", reason: "The model returned a malformed tool call" });
        continue;
      }
      throw err;
    }
  }
}

function isBadToolCall(err: unknown): boolean {
  if (!(err instanceof Groq.APIError) || err.status !== 400) return false;
  return /tool_use_failed|failed to call a function/i.test(`${err.message} ${JSON.stringify(err.error ?? "")}`);
}

/** Groq sends the tool arguments as a JSON string. */
async function runTool(name: string, rawArguments: string): Promise<AgentStep> {
  let rawArgs: unknown;
  try {
    rawArgs = rawArguments?.trim() ? JSON.parse(rawArguments) : {};
  } catch {
    return { tool: name, args: rawArguments, ok: false, writes: false, error: "Invalid arguments: not valid JSON" };
  }

  // The model may send null for optional arguments (see allowNullForOptional). Treat null as "not given".
  if (rawArgs && typeof rawArgs === "object" && !Array.isArray(rawArgs)) {
    rawArgs = Object.fromEntries(Object.entries(rawArgs).filter(([, v]) => v !== null));
  }

  const tool = tools.find((t) => t.name === name);
  if (!tool) {
    return { tool: name, args: rawArgs, ok: false, writes: false, error: `Unknown tool: ${name}` };
  }

  // Never trust the model's arguments: check them with Zod first.
  const parsed = tool.schema.safeParse(rawArgs);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join(".") || "args"}: ${i.message}`).join("; ");
    return { tool: name, args: rawArgs, ok: false, writes: tool.writes, error: `Invalid arguments: ${message}` };
  }

  try {
    const result = await tool.run(parsed.data);
    return { tool: name, args: parsed.data, ok: true, writes: tool.writes, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool failed";
    return { tool: name, args: parsed.data, ok: false, writes: tool.writes, error: message };
  }
}
