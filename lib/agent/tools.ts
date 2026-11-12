import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { getSupabase } from "../supabase";
import { CURRENT_USER_ID } from "../currentUser";
import { todayInIndia } from "../dates";
import {
  ORDER_COLUMNS,
  checkEligibility,
  daysBetween,
  getItemsByOrder,
  getOwnOrder,
} from "../support";
import { getReturnPolicy } from "../policy";
import { findOpenTicketForOrder, listMyTickets } from "../tickets";

/*
 * Tools for the ShopEase Customer Support Agent (seed/ecommerce_support.sql).
 * Every tool is scoped to CURRENT_USER_ID. No tool accepts a customer id.
 */

const orderId = z.number().int().positive().describe("The order number, for example 1003");

const getMyOrders = defineTool({
  name: "getMyOrders",
  description:
    "Use this when the customer asks about their orders in general, wants to find an order (for example 'my last order' or 'the order with the shoes'), or you do not know an order number. Returns up to 20 orders, newest first, each with its items.",
  schema: z.object({
    status: z
      .enum(["placed", "shipped", "out_for_delivery", "delivered", "cancelled"])
      .optional()
      .describe("Only return orders with this status. Omit for all orders."),
  }),
  run: async ({ status }) => {
    let query = getSupabase()
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("customer_id", CURRENT_USER_ID)
      .order("order_date", { ascending: false })
      .order("id", { ascending: false })
      .limit(20);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const items = await getItemsByOrder(data.map((o) => o.id as number));
    return {
      count: data.length,
      orders: data.map((o) => ({ ...o, items: items[o.id as number] ?? [] })),
    };
  },
});

const getOrderDetails = defineTool({
  name: "getOrderDetails",
  description:
    "Use this when the customer asks where an order is, its status, delivery date, courier, tracking number or whether it is late. Returns the order, its items, any returns on it, and days_late for undelivered orders past their expected date.",
  schema: z.object({ order_id: orderId }),
  run: async ({ order_id }) => {
    const order = await getOwnOrder(order_id);
    const items = (await getItemsByOrder([order_id]))[order_id] ?? [];
    const { data: returns, error } = await getSupabase()
      .from("returns")
      .select("id, product_id, reason, status, created_at")
      .eq("order_id", order_id);
    if (error) throw new Error(error.message);

    const today = todayInIndia();
    const open = order.status !== "delivered" && order.status !== "cancelled";
    const daysLate =
      open && order.expected_delivery && order.expected_delivery < today
        ? daysBetween(order.expected_delivery, today)
        : 0;
    return { today, order, items, returns, days_late: daysLate };
  },
});

const checkReturnEligibility = defineTool({
  name: "checkReturnEligibility",
  description:
    "Use this when the customer asks whether they can return a product, before creating a return. Checks the return policy for one product in one order.",
  schema: z.object({
    order_id: orderId,
    product_id: z.string().trim().min(1).describe("The product id from the order items, for example P101"),
  }),
  run: async ({ order_id, product_id }) => checkEligibility(order_id, product_id),
});

const createReturnRequest = defineTool({
  name: "createReturnRequest",
  description:
    "Use this when the customer clearly wants to return a product from a delivered order and has given a reason. The policy is re-checked here; if it fails, an error explains why.",
  writes: true,
  schema: z.object({
    order_id: orderId,
    product_id: z.string().trim().min(1).describe("The product id from the order items, for example P101"),
    reason: z.string().trim().min(3).max(300).describe("Why the customer is returning it, in their words"),
  }),
  run: async ({ order_id, product_id, reason }) => {
    const check = await checkEligibility(order_id, product_id);
    if (!check.eligible) throw new Error(check.reason);

    const { data, error } = await getSupabase()
      .from("returns")
      .insert({ order_id, product_id, reason })
      .select("id, order_id, product_id, reason, status, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { created: data, product_name: check.product_name, return_deadline: check.return_deadline };
  },
});

const escalateToHuman = defineTool({
  name: "escalateToHuman",
  description:
    "Use this when you cannot resolve the problem yourself: a late or missing order, a damaged item, a refused return the customer disputes, or anything outside the tools. Creates a support ticket for a human agent.",
  writes: true,
  schema: z.object({
    issue: z.string().trim().min(5).max(500).describe("Short summary of the problem for the human agent"),
    order_id: orderId.optional().describe("The related order number, if there is one"),
    priority: z
      .enum(["low", "medium", "high"])
      .optional()
      .describe("high for orders 3+ days late or damaged items, low for general questions. Default medium."),
  }),
  run: async ({ issue, order_id, priority }) => {
    if (order_id) {
      await getOwnOrder(order_id);
      // Guardrail in code: one unresolved ticket per order. Do not create a duplicate.
      const existing = await findOpenTicketForOrder(order_id);
      if (existing) {
        return {
          ticket: existing,
          already_existed: true,
          note: "The customer already has an unresolved ticket for this order. No new ticket was created.",
        };
      }
    }
    const { data, error } = await getSupabase()
      .from("support_tickets")
      .insert({
        customer_id: CURRENT_USER_ID,
        order_id: order_id ?? null,
        issue,
        priority: priority ?? "medium",
      })
      .select("id, order_id, issue, priority, status, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { ticket: data };
  },
});

const getMyReturns = defineTool({
  name: "getMyReturns",
  description:
    "Use this when the customer asks about the status of a return or refund they already asked for, or what returns they have. Returns their return requests (newest first) with product names and status. Optionally for one order.",
  schema: z.object({
    order_id: orderId.optional().describe("Only returns for this order. Omit for all returns."),
  }),
  run: async ({ order_id }) => {
    if (order_id) await getOwnOrder(order_id);
    const db = getSupabase();
    const { data: orders, error: oErr } = await db.from("orders").select("id").eq("customer_id", CURRENT_USER_ID);
    if (oErr) throw new Error(oErr.message);
    const orderIds = order_id ? [order_id] : orders.map((o) => o.id as number);
    if (orderIds.length === 0) return { count: 0, returns: [] };

    const { data: returns, error } = await db
      .from("returns")
      .select("id, order_id, product_id, reason, status, created_at")
      .in("order_id", orderIds)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);

    const productIds = [...new Set(returns.map((r) => r.product_id as string))];
    const { data: products, error: pErr } = productIds.length
      ? await db.from("products").select("id, name").in("id", productIds)
      : { data: [], error: null };
    if (pErr) throw new Error(pErr.message);
    const names = new Map((products ?? []).map((p) => [p.id as string, p.name as string]));
    return {
      count: returns.length,
      returns: returns.map((r) => ({ ...r, product_name: names.get(r.product_id as string) ?? r.product_id })),
    };
  },
});

const getMyTickets = defineTool({
  name: "getMyTickets",
  description:
    "Use this when the customer asks about a support ticket, whether anyone is looking at their problem, or what happened to a complaint they raised. Returns their support tickets (newest first) with priority and status.",
  schema: z.object({
    status: z
      .enum(["open", "in_progress", "resolved"])
      .optional()
      .describe("Only tickets with this status. Omit for all tickets."),
  }),
  run: async ({ status }) => {
    const tickets = await listMyTickets(status);
    return { count: tickets.length, tickets };
  },
});

const getReturnPolicyTool = defineTool({
  name: "getReturnPolicy",
  description:
    "Use this for general questions about the return policy, or whether a kind of product can be returned and for how many days (for example 'can I return a hair dryer?'). Not for a specific order; use checkReturnEligibility for that.",
  schema: z.object({
    query: z
      .string()
      .trim()
      .min(1)
      .max(60)
      .optional()
      .describe("A product name, product id or category, for example 'shoes' or 'Electronics'. Omit for a summary."),
  }),
  run: async ({ query }) => getReturnPolicy(query),
});

/** Every tool in this list is given to the model. Write tools have writes: true. */
export const tools: AgentTool[] = [
  getMyOrders,
  getOrderDetails,
  checkReturnEligibility,
  createReturnRequest,
  escalateToHuman,
  getMyReturns,
  getMyTickets,
  getReturnPolicyTool,
];
