# Member 3 · Backend + Database

**Name:** ______  **Handbook prompts:** H4 (rules), H6, H8 · **Back to:** [team plan](README.md)

## You own
- Supabase project and the seed: `seed/ecommerce_support.sql`
- Business rules and data helpers: `lib/support.ts`, `lib/currentUser.ts`
- Read APIs: `app/api/orders/route.ts`, `app/api/returns/route.ts`
Do **not** edit `lib/agent/` (Member 2) or `app/page.tsx`, `components/` (Member 4).

## Checklist

- [ ] **T1. Supabase first, everyone waits for this.** Create a project at supabase.com → SQL Editor → run all of `seed/ecommerce_support.sql`. Settings → copy the **Project URL** and the **secret (service_role) key**. Put them in your `.env.local` (names are in `.env.example`) and share them privately with M1 (Vercel) and the team. Never paste them in a public place or commit them.
- [ ] **T2. Verify the data** with the SQL below.
- [ ] **T3. Check `/api/health`** shows nothing missing, then open `/api/orders` and `/api/returns` in the browser; you should see JSON for C001.
- [ ] **T4. Rule tests on the helper** (prompt below). The return rule must live in code.
- [ ] **T5. Stretch helper `checkCancellable`** for M2's cancel tool (prompt below).
- [ ] **T6. Stretch API for the admin page** (prompt below).
- [ ] Commit after each step: `git add . && git commit -m "<what>" && git push`.

## T2. Verification SQL (Supabase → SQL Editor)

```sql
select count(*) from orders;                                   -- 100
select count(*) from order_items;                              -- at least 100
select id, status, expected_delivery, delivered_date from orders
 where customer_id = 'C001' order by id;                       -- 1001, 1003, 1007, 1012, 1020, 1025, 1031
select o.id, p.name, p.return_window_days, o.delivered_date
  from order_items i join orders o on o.id = i.order_id join products p on p.id = i.product_id
 where o.id in (1001, 1003, 1007, 1025);
```

Expected for C001 demos:
- **1003** shipped, expected 4 days ago → late.
- **1007** delivered 3 days ago, has **P101 Stride Running Shoes** (10-day window) → return allowed.
- **1001** delivered 40 days ago → return refused (window over).
- **1012** `placed` → cancellable (stretch).
- **1025** delivered, has 0-day-window items (face wash, sunscreen) → not returnable.

Notes: re-running the seed **wipes** returns and tickets created while testing. Row Level Security is on; only the server (secret key) can read or write.

## T4. Rule tests (H8, backend side)

The agent's refusals come from `checkEligibility` in `lib/support.ts`. Check that file against this table and report any mismatch to the team:

| Case | Expected result |
| --- | --- |
| Order not C001's (e.g. 1002) | Error "was not found on your account" |
| Product not in the order | `eligible: false`, "is not part of order" |
| Order not delivered (1003) | `eligible: false`, status in the reason |
| Delivered but outside window (1001 T-shirt P104) | `eligible: false`, deadline date in the reason |
| 0-day window (1025 face wash P126) | `eligible: false`, "cannot be returned" |
| Delivered and inside window (1007 shoes P101) | `eligible: true`, deadline given |
| Same return twice | second is `eligible: false`, "already exists" |

If one fails, use:

```
In #file:lib/support.ts, checkEligibility returns <WHAT HAPPENED> for order <ID>, product <ID>. It should
return <WHAT SHOULD HAPPEN>. The rule: a return is allowed only for delivered orders, within the product's
return_window_days from delivered_date; products with a 0-day window cannot be returned; duplicate
non-rejected returns are refused. Fix it. Keep the function signature and return type unchanged.
```

## T5. Stretch: `checkCancellable`

```
In #file:lib/support.ts add and export async function checkCancellable(orderId: number): Promise<{
cancellable: boolean; reason: string }>. Use getOwnOrder(orderId) (throws if the order is not the
logged-in customer's). Cancellable only when orders.status is 'placed'. For shipped, out_for_delivery or
delivered return a reason that says the order can no longer be cancelled and, if delivered, that a return
may be possible. For an already cancelled order say so. Do not change any other function.
```

Tell M2 when it is pushed.

## T6. Stretch: ticket API for the admin page

```
Create app/api/admin/tickets/route.ts following the pattern of #file:app/api/returns/route.ts. GET:
return all support_tickets (id, customer_id, order_id, issue, priority, status, created_at) joined by
customer name from the customers table, newest first, at most 100 rows. Add
export const dynamic = "force-dynamic". Log errors with console.error and return status 500 with a short
message.
```

Tell M4 when it is pushed. (The passcode gate in `proxy.ts` already protects every API.)

## Hand-offs
- To **everyone:** Supabase URL and key, privately (T1).
- To **M2:** `checkCancellable` (T5).
- To **M4:** `/api/admin/tickets` (T6).
- To **M1:** table list and any DB facts for the README.
