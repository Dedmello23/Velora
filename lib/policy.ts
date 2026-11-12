import "server-only";
import { getSupabase } from "./supabase";

/** The store's rules in plain words. These match the checks in lib/support.ts. */
export const POLICY_RULES = [
  "A return is allowed only for delivered orders, within the product's return window counted from the delivery date.",
  "The return window depends on the product. A window of 0 days means the product cannot be returned.",
  "Only one active return request is allowed per product in an order.",
];

type ProductRow = { id: string; name: string; category: string; return_window_days: number };

/**
 * Return policy, read from the products table so it is never made up.
 * With a query (product id, name or category) it lists matching products; without one it summarises by category.
 */
let cache: { at: number; products: ProductRow[] } | null = null;
const CACHE_MS = 5 * 60_000;

/** The products table almost never changes, so keep it in memory for a few minutes instead of querying every time. */
async function loadProducts(): Promise<ProductRow[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.products;
  const { data, error } = await getSupabase()
    .from("products")
    .select("id, name, category, return_window_days")
    .order("id");
  if (error) throw new Error(error.message);
  cache = { at: Date.now(), products: data as ProductRow[] };
  return cache.products;
}

export async function getReturnPolicy(query?: string) {
  const products = await loadProducts();

  const q = query?.trim().toLowerCase();
  if (q) {
    const matches = products.filter(
      (p) => p.id.toLowerCase() === q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
    return {
      rules: POLICY_RULES,
      matches: matches.slice(0, 15).map((p) => ({
        product_id: p.id,
        name: p.name,
        category: p.category,
        return_window_days: p.return_window_days,
        returnable: p.return_window_days > 0,
      })),
      note: matches.length === 0 ? "No product matched. Ask the customer which product they mean." : undefined,
    };
  }

  const byCategory = new Map<string, { windows: Set<number>; non_returnable: string[] }>();
  for (const p of products) {
    const entry = byCategory.get(p.category) ?? { windows: new Set<number>(), non_returnable: [] };
    entry.windows.add(p.return_window_days);
    if (p.return_window_days === 0) entry.non_returnable.push(p.name);
    byCategory.set(p.category, entry);
  }
  return {
    rules: POLICY_RULES,
    categories: [...byCategory.entries()].map(([category, e]) => ({
      category,
      return_window_days: [...e.windows].sort((a, b) => a - b),
      non_returnable_products: e.non_returnable,
    })),
  };
}
