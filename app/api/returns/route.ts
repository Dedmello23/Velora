import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { CURRENT_USER_ID } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getSupabase();
    const { data: orders, error: oErr } = await db
      .from("orders")
      .select("id")
      .eq("customer_id", CURRENT_USER_ID);
    if (oErr) throw new Error(oErr.message);
    const orderIds = orders.map((o) => o.id as number);
    if (orderIds.length === 0) return NextResponse.json({ returns: [], tickets: [] });

    const { data: returns, error } = await db
      .from("returns")
      .select("id, order_id, product_id, reason, status, created_at")
      .in("order_id", orderIds)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    const productIds = [...new Set(returns.map((r) => r.product_id as string))];
    const { data: products, error: pErr } = productIds.length
      ? await db.from("products").select("id, name").in("id", productIds)
      : { data: [], error: null };
    if (pErr) throw new Error(pErr.message);
    const names = new Map((products ?? []).map((p) => [p.id as string, p.name as string]));

    const { data: tickets, error: tErr } = await db
      .from("support_tickets")
      .select("id, order_id, issue, priority, status, created_at")
      .eq("customer_id", CURRENT_USER_ID)
      .order("created_at", { ascending: false })
      .limit(50);
    if (tErr) throw new Error(tErr.message);

    return NextResponse.json({
      returns: returns.map((r) => ({ ...r, product_name: names.get(r.product_id as string) ?? r.product_id })),
      tickets,
    });
  } catch (err) {
    console.error("GET /api/returns failed:", err);
    return NextResponse.json({ error: "Could not load returns." }, { status: 500 });
  }
}
