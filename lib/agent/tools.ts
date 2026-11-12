import "server-only";
import type { AgentTool } from "./defineTool";

/*
 * Tools for the E-commerce Customer Support Agent (seed/ecommerce_support.sql).
 * Tables: customers, products, orders, order_items, returns, support_tickets.
 *
 * Tips:
 *  - Use defineTool() with a Zod schema; start descriptions with "Use this when ...".
 *  - Describe every field, including its format (for example YYYY-MM-DD).
 *  - Return small, clean objects. Gemini reads what you return.
 *  - Throw an Error with a clear message when something is wrong. The agent will explain it.
 */

/** Every tool in this list is given to Gemini. */
export const tools: AgentTool[] = [];
