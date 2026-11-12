import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { CURRENT_USER_ID } from "@/lib/currentUser";
import { ORDER_COLUMNS, getItemsByOrder } from "@/lib/support";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("customer_id", CURRENT_USER_ID)
      .order("order_date", { ascending: false })
      .order("id", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    const items = await getItemsByOrder(data.map((o) => o.id as number));
    return NextResponse.json({ orders: data.map((o) => ({ ...o, items: items[o.id as number] ?? [] })) });
  } catch (err) {
    console.error("GET /api/orders failed:", err);
    return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  }
}
