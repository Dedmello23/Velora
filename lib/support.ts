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

/** Items (with product names and return windows) for the given orders, grouped by order id. */
export async function getItemsByOrder(orderIds: number[]): Promise<Record<number, OrderItemView[]>> {
  if (orderIds.length === 0) return {};
  const db = getSupabase();
  const { data: items, error } = await db
    .from("order_items")
    .select("order_id, product_id, quantity, unit_price")
    .in("order_id", orderIds);
  if (error) throw new Error(error.message);

  const productIds = [...new Set((items ?? []).map((i) => i.product_id as string))];
  const { data: products, error: pErr } = await db
    .from("products")
    .select("id, name, return_window_days")
    .in("id", productIds);
  if (pErr) throw new Error(pErr.message);
  const byId = new Map((products ?? []).map((p) => [p.id as string, p]));

  const out: Record<number, OrderItemView[]> = {};
  for (const i of items ?? []) {
    const p = byId.get(i.product_id as string);
    (out[i.order_id as number] ??= []).push({
      product_id: i.product_id as string,
      name: (p?.name as string) ?? i.product_id,
      quantity: i.quantity as number,
      unit_price: Number(i.unit_price),
      return_window_days: (p?.return_window_days as number) ?? 0,
    });
  }
  return out;
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
  const order = await getOwnOrder(orderId);
  const items = (await getItemsByOrder([orderId]))[orderId] ?? [];
  const item = items.find((i) => i.product_id === productId);
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

  const { data: existing, error } = await getSupabase()
    .from("returns")
    .select("id, status")
    .eq("order_id", orderId)
    .eq("product_id", productId)
    .neq("status", "rejected")
    .limit(1);
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
