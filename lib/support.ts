import "server-only";
import { getSupabase } from "./supabase";
import { CURRENT_USER_ID } from "./currentUser";
import { todayInIndia } from "./dates";

const DAY_MS = 86_400_000;

/** Whole days from date `a` to date `b` (both YYYY-MM-DD). Positive if b is later. */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / DAY_MS);
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);
}

type OrderRow = {
  id: number;
  order_date: string;
  status: string;
  expected_delivery: string | null;
  delivered_date: string | null;
  total_amount: number;
  courier: string | null;
  tracking_number: string | null;
};

export const ORDER_COLUMNS =
  "id, order_date, status, expected_delivery, delivered_date, total_amount, courier, tracking_number";

/** Loads an order only if it belongs to the logged-in customer. Throws a clear error otherwise. */
export async function getOwnOrder(orderId: number): Promise<OrderRow> {
  const { data, error } = await getSupabase()
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", orderId)
    .eq("customer_id", CURRENT_USER_ID)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Order ${orderId} was not found on your account.`);
  return data as OrderRow;
}

export type OrderItemView = {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  return_window_days: number;
};

/** PostgREST returns an embedded to-one row as an object, but typings and joins can give a one-item array. */
function one<T>(v: T | T[] | null | undefined): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

type RawItem = {
  order_id?: number;
  product_id: string;
  quantity: number;
  unit_price: number | string;
  products?: { name: string; return_window_days: number } | { name: string; return_window_days: number }[] | null;
};

function toItemView(i: RawItem): OrderItemView {
  const p = one(i.products);
  return {
    product_id: i.product_id,
    name: p?.name ?? i.product_id,
    quantity: i.quantity,
    unit_price: Number(i.unit_price),
    return_window_days: p?.return_window_days ?? 0,
  };
}

/** One embedded select: the items of an order with each product's name and return window. */
export const ITEMS_EMBED = "order_items(product_id, quantity, unit_price, products(name, return_window_days))";

export type ReturnSummary = { id: number; product_id: string; reason: string; status: string; created_at: string };
export type OrderWithItems = OrderRow & { items: OrderItemView[]; returns?: ReturnSummary[] };

/** Also embed the returns raised on each order (still ONE query). */
const RETURNS_EMBED = "returns(id, product_id, reason, status, created_at)";

/** Days an undelivered order is past its expected date. 0 if it is on time, delivered or cancelled. */
export function daysLate(
  order: { status: string; expected_delivery: string | null },
  today: string = todayInIndia()
): number {
  const open = order.status !== "delivered" && order.status !== "cancelled";
  return open && order.expected_delivery && order.expected_delivery < today
    ? daysBetween(order.expected_delivery, today)
    : 0;
}

function withItems(row: unknown): OrderWithItems {
  const { order_items, ...order } = row as OrderRow & { order_items?: RawItem[] };
  return { ...order, items: (order_items ?? []).map(toItemView) };
}

/** Items (with product names and return windows) for the given orders, grouped by order id. ONE round trip. */
export async function getItemsByOrder(orderIds: number[]): Promise<Record<number, OrderItemView[]>> {
  if (orderIds.length === 0) return {};
  const { data, error } = await getSupabase()
    .from("order_items")
    .select("order_id, product_id, quantity, unit_price, products(name, return_window_days)")
    .in("order_id", orderIds);
  if (error) throw new Error(error.message);

  const out: Record<number, OrderItemView[]> = {};
  for (const i of (data ?? []) as unknown as RawItem[]) {
    (out[i.order_id as number] ??= []).push(toItemView(i));
  }
  return out;
}

/** The customer's orders with their items in ONE query. Newest first. */
export async function getOrdersWithItems(
  opts: { status?: string; limit?: number; returns?: boolean } = {}
): Promise<OrderWithItems[]> {
  let query = getSupabase()
    .from("orders")
    .select(`${ORDER_COLUMNS}, ${ITEMS_EMBED}${opts.returns ? `, ${RETURNS_EMBED}` : ""}`)
    .eq("customer_id", CURRENT_USER_ID)
    .order("order_date", { ascending: false })
    .order("id", { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.status) query = query.eq("status", opts.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(withItems);
}

/** One of the customer's orders with its items in ONE query. Throws if it is not theirs. */
export async function getOwnOrderWithItems(
  orderId: number,
  opts: { returns?: boolean } = {}
): Promise<OrderWithItems> {
  const { data, error } = await getSupabase()
    .from("orders")
    .select(`${ORDER_COLUMNS}, ${ITEMS_EMBED}${opts.returns ? `, ${RETURNS_EMBED}` : ""}`)
    .eq("id", orderId)
    .eq("customer_id", CURRENT_USER_ID)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Order ${orderId} was not found on your account.`);
  return withItems(data);
}

export type Eligibility = {
  eligible: boolean;
  reason: string;
  order_id: number;
  product_id: string;
  product_name?: string;
  delivered_date?: string | null;
  return_window_days?: number;
  return_deadline?: string;
};

/**
 * THE RETURN RULE (checked in code, not only in the prompt):
 * allowed only for delivered orders, within products.return_window_days of delivered_date.
 */
export async function checkEligibility(orderId: number, productId: string): Promise<Eligibility> {
  // Two independent reads run in parallel: the order with its items, and any existing return.
  const [orderResult, existingResult] = await Promise.all([
    getOwnOrderWithItems(orderId).then((order) => ({ order, error: null as Error | null }), (error: Error) => ({ order: null, error })),
    getSupabase()
      .from("returns")
      .select("id, status")
      .eq("order_id", orderId)
      .eq("product_id", productId)
      .neq("status", "rejected")
      .limit(1),
  ]);
  if (orderResult.error || !orderResult.order) throw orderResult.error ?? new Error("Order lookup failed.");
  const order = orderResult.order;
  const item = order.items.find((i) => i.product_id === productId);
  const base = { order_id: orderId, product_id: productId };

  if (!item) {
    return { ...base, eligible: false, reason: `Product ${productId} is not part of order ${orderId}.` };
  }
  const info = {
    ...base,
    product_name: item.name,
    delivered_date: order.delivered_date,
    return_window_days: item.return_window_days,
  };

  if (order.status !== "delivered" || !order.delivered_date) {
    return {
      ...info,
      eligible: false,
      reason: `Order ${orderId} is "${order.status}". Returns are only allowed after delivery.`,
    };
  }
  if (item.return_window_days <= 0) {
    return { ...info, eligible: false, reason: `${item.name} cannot be returned (no return window).` };
  }

  const deadline = addDays(order.delivered_date, item.return_window_days);
  const today = todayInIndia();
  if (today > deadline) {
    return {
      ...info,
      return_deadline: deadline,
      eligible: false,
      reason: `The ${item.return_window_days}-day return window for ${item.name} ended on ${deadline} (delivered ${order.delivered_date}).`,
    };
  }

  const { data: existing, error } = existingResult;
  if (error) throw new Error(error.message);
  if (existing && existing.length > 0) {
    return {
      ...info,
      return_deadline: deadline,
      eligible: false,
      reason: `A return for ${item.name} on order ${orderId} already exists (return #${existing[0].id}, status "${existing[0].status}").`,
    };
  }

  return {
    ...info,
    return_deadline: deadline,
    eligible: true,
    reason: `Eligible: delivered ${order.delivered_date}, return allowed until ${deadline}.`,
  };
}

/**
 * THE CANCELLATION RULE (stretch):
 * Cancellable only when orders.status is 'placed'.
 */
export async function checkCancellable(
  orderId: number
): Promise<{ cancellable: boolean; reason: string }> {
  const order = await getOwnOrder(orderId);

  if (order.status === "placed") {
    return {
      cancellable: true,
      reason: `Order ${orderId} has status "placed" and has not shipped yet. It can be cancelled.`,
    };
  }

  if (order.status === "cancelled") {
    return {
      cancellable: false,
      reason: `Order ${orderId} has already been cancelled.`,
    };
  }

  if (order.status === "delivered") {
    return {
      cancellable: false,
      reason: `Order ${orderId} has already been delivered and can no longer be cancelled. A return may be possible instead.`,
    };
  }

  return {
    cancellable: false,
    reason: `Order ${orderId} is "${order.status}" and can no longer be cancelled.`,
  };
}

