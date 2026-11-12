import "server-only";
import { todayInIndia } from "./dates";
import { addDays, daysBetween, getOrdersWithItems } from "./support";

type Returnable = { order_id: number; product_id: string; name: string; return_until: string; days_left: number };
type NotReturnable = { order_id: number; product_id: string; name: string; reason: string };

const MAX_PER_LIST = 10;

/**
 * Scans the logged-in customer's recent delivered orders and sorts every item into "can still be returned"
 * (soonest deadline first) or "cannot" (with a short reason). The model gets this in ONE small result instead of
 * checking items one by one. These are suggestions only: createReturnRequest re-checks the real rules in code.
 * Mirrors the order of checks in checkEligibility (lib/support.ts): no window, window ended, already requested.
 */
export async function findReturnableItems(productHint?: string) {
  const today = todayInIndia();
  const orders = await getOrdersWithItems({ status: "delivered", limit: 10, returns: true });
  const word = productHint?.trim().toLowerCase();

  const canReturn: Returnable[] = [];
  const cannotReturn: NotReturnable[] = [];

  for (const order of orders) {
    if (!order.delivered_date) continue;
    // Returns that are still active (a rejected return does not block a new request).
    const active = new Map(
      (order.returns ?? []).filter((r) => r.status !== "rejected").map((r) => [r.product_id, r])
    );

    for (const item of order.items) {
      if (word && !item.name.toLowerCase().includes(word) && item.product_id.toLowerCase() !== word) continue;
      const base = { order_id: order.id, product_id: item.product_id, name: item.name };

      if (item.return_window_days <= 0) {
        cannotReturn.push({ ...base, reason: "this product cannot be returned" });
        continue;
      }
      const until = addDays(order.delivered_date, item.return_window_days);
      if (today > until) {
        cannotReturn.push({ ...base, reason: `return window ended on ${until}` });
        continue;
      }
      const existing = active.get(item.product_id);
      if (existing) {
        cannotReturn.push({ ...base, reason: `return ${existing.id} already requested (${existing.status})` });
        continue;
      }
      canReturn.push({ ...base, return_until: until, days_left: daysBetween(today, until) });
    }
  }

  canReturn.sort((a, b) => a.days_left - b.days_left);
  return {
    today,
    can_return: canReturn.slice(0, MAX_PER_LIST),
    cannot_return: cannotReturn.slice(0, MAX_PER_LIST),
    ...(canReturn.length > MAX_PER_LIST || cannotReturn.length > MAX_PER_LIST
      ? { note: "Lists are shortened. Ask the customer to name a product to narrow it down." }
      : {}),
  };
}
