import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { CURRENT_USER_ID } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

type ReturnRow = {
  id: number;
  order_id: number;
  product_id: string;
  reason: string;
  status: string;
  created_at: string;
  products: { name: string } | { name: string }[] | null;
  orders?: unknown; // only used for the ownership filter; not sent to the browser
};

export async function GET() {
  try {
    const db = getSupabase();
    // Two independent queries, run in parallel (one round trip of waiting).
    // orders!inner limits returns to orders that belong to the logged-in customer.
    const [returnsRes, ticketsRes] = await Promise.all([
      db
        .from("returns")
        .select("id, order_id, product_id, reason, status, created_at, products(name), orders!inner(customer_id)")
        .eq("orders.customer_id", CURRENT_USER_ID)
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("support_tickets")
        .select("id, order_id, issue, priority, status, created_at")
        .eq("customer_id", CURRENT_USER_ID)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    if (returnsRes.error) throw new Error(returnsRes.error.message);
    if (ticketsRes.error) throw new Error(ticketsRes.error.message);

    const returns = (returnsRes.data as unknown as ReturnRow[]).map(({ products, orders: _orders, ...r }) => {
      const p = Array.isArray(products) ? products[0] : products;
      return { ...r, product_name: p?.name ?? r.product_id };
    });
    return NextResponse.json({ returns, tickets: ticketsRes.data });
  } catch (err) {
    console.error("GET /api/returns failed:", err);
    return NextResponse.json({ error: "Could not load returns." }, { status: 500 });
  }
}
