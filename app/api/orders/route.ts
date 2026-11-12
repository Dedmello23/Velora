import { NextResponse } from "next/server";
import { getOrdersWithItems } from "@/lib/support";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // One database round trip: orders + items + product names.
    return NextResponse.json({ orders: await getOrdersWithItems({ limit: 50 }) });
  } catch (err) {
    console.error("GET /api/orders failed:", err);
    return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  }
}
