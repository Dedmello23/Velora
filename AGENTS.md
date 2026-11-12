# Velora · ShopEase Customer Support Agent (PS1)

Business user: a ShopEase customer. Logged-in user id: `C001` (Priya Raman), from `lib/currentUser.ts`.

## Stack
- Next.js App Router, TypeScript, Tailwind, Supabase (server only, secret key), Gemini function calling, Zod. Do not change it.

## Tables (`seed/ecommerce_support.sql`)
- `customers`: id, name, email, phone, city
- `products`: id, name, category, price, return_window_days
- `orders`: id, customer_id, order_date, status (placed, shipped, out_for_delivery, delivered, cancelled), expected_delivery, delivered_date, total_amount, courier, tracking_number
- `order_items`: id, order_id, product_id, quantity, unit_price
- `returns`: id, order_id, product_id, reason, status (requested, approved, picked_up, refunded, rejected), created_at
- `support_tickets`: id, customer_id, order_id, issue, priority (low, medium, high), status (open, in_progress, resolved), created_at

## Agent rules
- Tools live in `lib/agent/tools.ts`, use `defineTool()` with a Zod schema, and descriptions start with "Use this when...".
- Never take a user id as a tool argument. Use `CURRENT_USER_ID` from `lib/currentUser.ts`.
- Business rule: a return is allowed only for delivered orders, within the product's `return_window_days` from `delivered_date`. It is checked in code in `lib/support.ts` (`checkEligibility`), not only in the prompt.
- Also refused in code: order not on the customer's account, product not in the order, return window of 0 days, duplicate non-rejected return.
- Write tools (`createReturnRequest`, `escalateToHuman`) set `writes: true` and throw `new Error("<clear message>")` when a rule fails.
- Use only the table and column names above. Return small objects from tools.

## File ownership (one owner per file)
- `lib/agent/`: AI member. `lib/support.ts`, `app/api/`, `seed/`: backend/database member.
- `app/page.tsx`, `app/orders`, `app/returns`, `components/`: frontend member.
- `AGENTS.md`, `README.md`, `docs/`: team lead.

## Safety
- Never use the Supabase secret key in components. Only `lib/` and `app/api/` may read it.
- Never commit `.env.local`. Run `npm run build` before every push.
