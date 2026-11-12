import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { getSupabase } from "../supabase";
import { CURRENT_USER_ID } from "../currentUser";
import { todayInIndia } from "../dates";
import {
  addDays,
  checkEligibility,
  daysLate,
  getOrdersWithItems,
  getOwnOrder,
  getOwnOrderWithItems,
  type OrderWithItems,
} from "../support";
import { getReturnPolicy } from "../policy";
import { findOpenTicketForOrder, listMyTickets } from "../tickets";

/*
 * Tools for the ShopEase Customer Support Agent (seed/ecommerce_support.sql).
 * Every tool is scoped to CURRENT_USER_ID. No tool accepts a customer id.
 */

const orderId = z.number().int().positive().describe("The order number, for example 1003");

/**
 * An order shaped for the model. Everything the model usually needs is already here (days_late, and for delivered
 * orders whether each item can still be returned), so it does not need extra tool calls to work it out.
 */
function agentOrder(o: OrderWithItems, today: string) {
  const { items, returns, ...order } = o;
  const late = daysLate(o, today);
  return {
    ...order,
    ...(late > 0 ? { days_late: late } : {}),
    items: items.map((i) => {
      const base = { product_id: i.product_id, name: i.name, quantity: i.quantity, unit_price: i.unit_price };
      if (o.status !== "delivered" || !o.delivered_date) return base;
      if (i.return_window_days <= 0) return { ...base, can_return_now: false, return_note: "cannot be returned" };
      const until = addDays(o.delivered_date, i.return_window_days);
      return { ...base, return_until: until, can_return_now: today <= until };
    }),
    ...(returns ? { returns } : {}),
  };
}

const getMyOrders = defineTool({
  name: "getMyOrders",
  description:
    "Use this when the customer asks about their orders in general, wants to find an order (for example 'my last order', 'the order with the shoes') or you do not know an order number. Returns orders newest first, each with items, days_late (if late) and, for delivered orders, can_return_now and return_until per item (not counting returns already raised). Often this alone answers the question.",
  schema: z.object({
    status: z
      .enum(["placed", "shipped", "out_for_delivery", "delivered", "cancelled"])
      .optional()
      .describe("Only return orders with this status. Omit for all orders."),
    product: z
      .string()
      .trim()
      .min(1)
      .max(60)
      .optional()
      .describe("Only orders that contain a product whose name has this word, for example 'shoes'."),
  }),
  run: async ({ status, product }) => {
    const today = todayInIndia();
    // One query. When searching by product we look at more orders, then keep the newest few.
    const orders = await getOrdersWithItems({ status, limit: product ? 50 : 10 });
    const word = product?.toLowerCase();
    const found = word ? orders.filter((o) => o.items.some((i) => i.name.toLowerCase().includes(word))) : orders;
    const shown = found.slice(0, 10);
    return { today, count: shown.length, orders: shown.map((o) => agentOrder(o, today)) };
  },
});

const getOrderDetails = defineTool({
  name: "getOrderDetails",
  description:
    "Use this when the customer asks where one order is, its status, delivery date, courier, tracking number or whether it is late. Omit order_id for their newest order ('my last order'). Returns the order, its items, any returns on it, and days_late.",
  schema: z.object({
    order_id: orderId.optional().describe("The order number. Omit for the customer's newest order."),
  }),
  run: async ({ order_id }) => {
    const today = todayInIndia();
    // One query for the order, its items and its returns.
    const order =
      order_id !== undefined
        ? await getOwnOrderWithItems(order_id, { returns: true })
        : (await getOrdersWithItems({ limit: 1, returns: true }))[0];
    if (!order) throw new Error("You have no orders yet.");
    return { today, order: agentOrder(order, today) };
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
    let level = priority ?? "medium";
    if (order_id) {
      // Both checks run at the same time.
      const [order, existing] = await Promise.all([getOwnOrder(order_id), findOpenTicketForOrder(order_id)]);
      // Guardrail in code: one unresolved ticket per order. Do not create a duplicate.
      if (existing) {
        return {
          ticket: existing,
          already_existed: true,
          note: "The customer already has an unresolved ticket for this order. No new ticket was created.",
        };
      }
      // Rule in code: 3 or more days late is always high priority, whatever the model chose.
      if (daysLate(order) >= 3) level = "high";
    }
    const { data, error } = await getSupabase()
      .from("support_tickets")
      .insert({
        customer_id: CURRENT_USER_ID,
        order_id: order_id ?? null,
        issue,
        priority: level,
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
    // One query: returns joined with the product name, limited to this customer's orders.
    let query = getSupabase()
      .from("returns")
      .select("id, order_id, product_id, reason, status, created_at, products(name), orders!inner(customer_id)")
      .eq("orders.customer_id", CURRENT_USER_ID)
      .order("created_at", { ascending: false })
      .limit(20);
    if (order_id) query = query.eq("order_id", order_id);
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const returns = (data as unknown as Array<Record<string, unknown>>).map(({ products, orders: _orders, ...r }) => {
      const p = (Array.isArray(products) ? products[0] : products) as { name?: string } | null;
      return { ...r, product_name: p?.name ?? r.product_id };
    });
    return { count: returns.length, returns };
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
