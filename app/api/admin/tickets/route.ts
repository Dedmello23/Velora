import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type TicketRow = {
  id: number;
  customer_id: string;
  order_id: number | null;
  issue: string;
  priority: string;
  status: string;
  created_at: string;
  customers: { name: string } | { name: string }[] | null;
};

export async function GET() {
  try {
    // One query: tickets joined with the customer's name.
    const { data, error } = await getSupabase()
      .from("support_tickets")
      .select("id, customer_id, order_id, issue, priority, status, created_at, customers(name)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const tickets = (data as unknown as TicketRow[]).map(({ customers, ...t }) => {
      const c = Array.isArray(customers) ? customers[0] : customers;
      return { ...t, customer_name: c?.name ?? t.customer_id };
    });
    return NextResponse.json({ tickets });
  } catch (err) {
    console.error("GET /api/admin/tickets failed:", err);
    return NextResponse.json({ error: "Could not load admin tickets." }, { status: 500 });
  }
}
