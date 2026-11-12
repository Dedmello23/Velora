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
    if (order_id) await getOwnOrder(order_id);
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

/** Every tool in this list is given to the model. */
export const tools: AgentTool[] = [
  getMyOrders,
  getOrderDetails,
  checkReturnEligibility,
  createReturnRequest,
  escalateToHuman,
];
