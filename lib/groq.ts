import "server-only";
import Groq from "groq-sdk";
import { requireEnv } from "./env";

let client: Groq | null = null;

/** One shared Groq client. The key is read on the server only. */
export function getGroq(): Groq {
  if (!client) {
    client = new Groq({ apiKey: requireEnv("GROQ_API_KEY") });
  }
  return client;
}
