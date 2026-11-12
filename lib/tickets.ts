import "server-only";
import { getSupabase } from "./supabase";
import { CURRENT_USER_ID } from "./currentUser";

export type TicketStatus = "open" | "in_progress" | "resolved";

const TICKET_COLUMNS = "id, order_id, issue, priority, status, created_at";

/** The logged-in customer's support tickets, newest first. Never takes a customer id. */
export async function listMyTickets(status?: TicketStatus, limit = 20) {
  let query = getSupabase()
    .from("support_tickets")
    .select(TICKET_COLUMNS)
    .eq("customer_id", CURRENT_USER_ID)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

/** An unresolved ticket this customer already has for the order, if any. Used to avoid duplicate tickets. */
export async function findOpenTicketForOrder(orderId: number) {
  const { data, error } = await getSupabase()
    .from("support_tickets")
    .select(TICKET_COLUMNS)
    .eq("customer_id", CURRENT_USER_ID)
    .eq("order_id", orderId)
    .neq("status", "resolved")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return data[0] ?? null;
}
