import "server-only";
import { z } from "zod";

/**
 * One agent tool = a name + a description + a Zod schema for its arguments + the code it runs.
 * The model (Groq) reads the name, description and schema to decide WHEN to call the tool.
 * Your code runs the tool. The model never touches the database directly.
 */
export type AgentTool = {
  name: string;
  description: string;
  schema: z.ZodObject;
  writes: boolean;
  run: (args: unknown) => Promise<unknown>;
};

export function defineTool<S extends z.ZodObject>(tool: {
  name: string;
  description: string;
  schema: S;
  /** true if this tool inserts, updates or deletes data */
  writes?: boolean;
  run: (args: z.infer<S>) => Promise<unknown>;
}): AgentTool {
  return {
    name: tool.name,
    description: tool.description,
    schema: tool.schema,
    writes: tool.writes ?? false,
    run: (args) => tool.run(args as z.infer<S>),
  };
}

// Only these JSON Schema keys are sent to the model. Zod still checks everything else.
const ALLOWED_KEYS = new Set([
  "type",
  "properties",
  "required",
  "description",
  "enum",
  "items",
  "nullable",
  "format",
]);

function clean(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(clean);
  if (!node || typeof node !== "object") return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (key === "properties" && value && typeof value === "object") {
      out.properties = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, clean(v)])
      );
    } else if (key === "format" && value !== "date-time" && value !== "enum") {
      continue;
    } else {
      out[key] = clean(value);
    }
  }
  return out;
}

/**
 * Models often send null for an optional argument they do not want to set. Groq checks the model's call
 * against this schema before our code runs and rejects null (HTTP 400, tool_use_failed). So optional
 * properties are declared nullable here, and runAgent removes the nulls before Zod checks the rest.
 */
function allowNullForOptional(schema: Record<string, unknown>): Record<string, unknown> {
  const props = schema.properties as Record<string, Record<string, unknown>> | undefined;
  if (!props) return schema;
  const required = new Set((schema.required as string[] | undefined) ?? []);
  const next: Record<string, Record<string, unknown>> = {};
  for (const [key, prop] of Object.entries(props)) {
    if (required.has(key)) {
      next[key] = prop;
      continue;
    }
    const type = prop.type;
    next[key] = {
      ...prop,
      ...(typeof type === "string" ? { type: [type, "null"] } : {}),
      ...(Array.isArray(prop.enum) ? { enum: [...prop.enum, null] } : {}),
    };
  }
  return { ...schema, properties: next };
}

/** A tool in the OpenAI-style format that Groq's chat API expects. */
export type ToolDefinition = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

/** Turns our tools into the tool definitions sent to Groq. */
export function toToolDefinitions(tools: AgentTool[]): ToolDefinition[] {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: allowNullForOptional(
        clean(z.toJSONSchema(tool.schema, { io: "input" })) as Record<string, unknown>
      ),
    },
  }));
}
