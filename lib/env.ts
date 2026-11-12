import "server-only";

/**
 * Reads an environment variable and stops with a clear message if it is missing.
 * All keys are read on the server only. They never reach the browser.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing environment variable ${name}. Add it to .env.local (and to Vercel project settings).`
    );
  }
  return value.trim();
}

/** Groq model used by the agent. Override with GROQ_MODEL (for example llama-3.3-70b-versatile). */
export const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";
