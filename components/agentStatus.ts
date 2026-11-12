import type { AgentEvent } from "@/lib/agent/types";

const TOOL_STATUS: Record<string, string> = {
  getMyOrders: "Looking up your orders",
  getOrderDetails: "Retrieving order details",
  checkReturnEligibility: "Checking return eligibility",
  createReturnRequest: "Submitting your return request",
  escalateToHuman: "Creating a support ticket",
  getMyReturns: "Checking your returns",
  getMyTickets: "Checking ticket status",
  getReturnPolicy: "Reading the return policy",
};

/** One short status line from a real agent event. Returns null to keep the current text. */
export function statusFor(event: AgentEvent): string | null {
  switch (event.type) {
    case "model_start":
      return event.round === 0 ? "Understanding your request" : "Preparing your answer";
    case "model_retry":
      return "Retrying";
    case "tool_start":
      return TOOL_STATUS[event.tool] ?? "Working on your request";
    case "tool_end":
      return event.ok ? "Analysing the results" : "That step failed, adjusting";
    default:
      return null;
  }
}
