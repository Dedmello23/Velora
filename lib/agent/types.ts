/** One tool call made by the agent. Sent to the browser so the user can see what the agent did. */
export type AgentStep = {
  tool: string;
  args: unknown;
  ok: boolean;
  writes: boolean;
  result?: unknown;
  error?: string;
};

export type AgentResult = {
  reply: string;
  steps: AgentStep[];
};

/**
 * Real execution events, emitted while the agent runs. The UI turns them into the activity feed.
 * They carry no model reasoning: only which stage started or finished, and which tool ran.
 */
export type AgentEvent =
  | { type: "model_start"; round: number }
  | { type: "model_retry"; reason: string }
  | { type: "tool_start"; id: string; tool: string; writes: boolean }
  | { type: "tool_end"; id: string; tool: string; ok: boolean; error?: string }
  | { type: "result"; reply: string; steps: AgentStep[] }
  | { type: "error"; message: string; status: number };
