import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getSupabase();
    const { data: tickets, error: tErr } = await db
      .from("support_tickets")
      .select("id, customer_id, order_id, issue, priority, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (tErr) throw new Error(tErr.message);

    const customerIds = [...new Set((tickets ?? []).map((t) => t.customer_id as string))];
    const { data: customers, error: cErr } = customerIds.length
      ? await db.from("customers").select("id, name").in("id", customerIds)
      : { data: [], error: null };
    if (cErr) throw new Error(cErr.message);

    const customerNames = new Map((customers ?? []).map((c) => [c.id as string, c.name as string]));

    return NextResponse.json({
      tickets: (tickets ?? []).map((t) => ({
        ...t,
        customer_name: customerNames.get(t.customer_id as string) ?? t.customer_id,
      })),
    });
  } catch (err) {
    console.error("GET /api/admin/tickets failed:", err);
    return NextResponse.json({ error: "Could not load admin tickets." }, { status: 500 });
  }
}
