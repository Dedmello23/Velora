# Velora · ShopEase Customer Support Agent: Project Status

SRM Agentic AI Hackathon, **PS1: E-commerce Customer Support Agent (ShopEase)**.
Source guide: `docs/7_SRM_Hackathon_Prompt_Handbook_1.pdf`.

## 1. Problem statement (as given)

- **Business user:** a customer of an online store. **Logged-in user:** customer C001 (Priya Raman).
- **Problem:** the support team answers the same questions all day: where is my order, can I return this, my order is late. Customers wait hours for simple answers.
- **Build:** a support chat where the customer asks in plain English. The agent checks the order, explains its status, starts a return when the return policy allows it, and raises a ticket for a human when it cannot help.
- **Pages:** Support chat, My Orders, My Returns.
- **Tables:** `customers`, `products`, `orders`, `order_items`, `returns`, `support_tickets`.
- **Suggested tools:** `getMyOrders`, `getOrderDetails`, `checkReturnEligibility`, `createReturnRequest` (writes), `escalateToHuman` (writes).
- **Business rule:** a return is allowed only for delivered orders, within the product's `return_window_days` from the delivery date.
- **Demo prompts:**
  1. "Where is my order 1003?"
  2. "I want to return the shoes from my last order, they are too small."
  3. "My order is 4 days late and nobody is answering."
- **Stretch:** order cancellation for orders not yet shipped, and an admin page for tickets.

## 2. Hackathon schedule and "done" criteria (from the guide)

| Time | What happens |
| --- | --- |
| 10:00 – 10:15 | Kickoff, rules, problem lottery |
| 10:15 – 10:30 | Read the problem, choose roles, write `AGENTS.md` (H1) |
| 10:30 – 10:45 | Quick setup: repo, seed data, run |
| 10:45 – 11:00 | Plan with AI (H2), show the plan to the mentor |
| 11:00 – 12:30 | Build the agent: read tools (H3), first write tool (H4), system prompt (H5) |
| 12:30 | Checkpoint: one of your own tools works in the chat |
| 12:30 – 1:30 | Lunch (push everything; `git status` clean) |
| 1:30 – 2:45 | API route (H6), page (H7), second write tool, extra features. Stop adding features at 2:45 |
| 2:45 – 3:30 | Test rules (H8), fix build (H9), phone check (H10), README (H11), 5 slides (H12) |
| 3:30 | **Code freeze.** Last push |
| 3:30 – 4:00 | Submit the Google Form: 5 slides, GitHub link, Vercel link |

| When | Done when |
| --- | --- |
| 12:30 | At least 1 of your own tools runs in the chat with your seed data |
| 3:30 | 2 or more tools work, 1 writes to Supabase, the Vercel link works, every member has committed |
| 4:00 | The Google Form is submitted with 5 slides, GitHub link and Vercel link |

Key idea from the guide: a working agent in the chat scores more than a beautiful screen with no agent.

## 3. What is built

### Cleanup
- Removed all other problems' seeds (starter `tasks`, EventEase demo, PS2 to PS8) and the `tasks` example code (`TaskList`, `/api/tasks`, `createTaskSchema`).
- The only seed left is `seed/ecommerce_support.sql`.

### Agent tools (`lib/agent/tools.ts`)

| Tool | Type | What it does |
| --- | --- | --- |
| `getMyOrders` | read | Lists the customer's orders (newest first, up to 20) with items; optional status filter |
| `getOrderDetails` | read | One order with items, returns on it, and `days_late` for undelivered orders past the expected date |
| `checkReturnEligibility` | read | Checks the return policy for one product in one order |
| `createReturnRequest` | **write** | Re-checks the policy, then inserts into `returns` |
| `escalateToHuman` | **write** | Inserts a `support_tickets` row (priority low / medium / high) |

### Rules enforced in code (`lib/support.ts`)
- The order must belong to C001, otherwise it is reported as not found.
- The product must be part of the order.
- The order status must be `delivered` and have a `delivered_date`.
- A product with `return_window_days = 0` cannot be returned.
- The return must be inside `delivered_date + return_window_days` (India date).
- No duplicate return: no existing non-rejected return for the same order and product.
- No tool accepts a customer id. All use `CURRENT_USER_ID` from `lib/currentUser.ts`.

### Pages and APIs
- `/` Support Chat (agent) with the three demo prompts as samples.
- `/orders` My Orders and `/returns` My Returns plus support tickets. Both refresh every 5 seconds.
- `GET /api/orders`, `GET /api/returns`, plus the existing `/api/agent`, `/api/health`, `/api/login`, `/api/logout`.
- Shared `AppHeader` (navigation, logout) and `StatusBadge`.

### Verification so far
- `npx tsc --noEmit` passes. `npm run build` passes (all routes compile).
- **Not tested against live Supabase or Gemini.** No `.env.local` was available.

## 4. Database check against the problem statement

- All six required tables exist in `seed/ecommerce_support.sql`.
- 100 orders, every order has items, no orphan items.
- Demo data for C001:
  - Order **1003**: shipped, expected 4 days ago, so it is **4 days late** (prompts 1 and 3).
  - Order **1007**: delivered 3 days ago, contains the shoes **P101** (10-day window), so the return is **allowed** (prompt 2). It also contains a yoga mat P120.
  - Order **1001**: delivered 40 days ago, so returns are **refused** (good refusal test). It already has a refunded return for P113.
  - Order **1012**: `placed`, so it is a good test for the cancellation stretch.
  - Order **1020**: out for delivery. Order **1031**: cancelled. Order **1025**: delivered, with products that have a 0-day window.
- Row Level Security is on for all tables. Only the server (secret key) can read and write.
- `returns` has no `customer_id`; ownership is found through `orders`.
- No database constraint stops duplicate returns; the code checks it.
- `orders.status` has no `cancel_requested` value. If the cancellation stretch is built, going straight to `cancelled` fits the current constraint.
- Re-running the seed drops and recreates the tables, which wipes returns and tickets created while testing.

## 5. Team split (4 members)

Each member has their own file with a checklist and ready-to-paste prompts for their own AI agent. Start at [`team/README.md`](team/README.md) (ownership map, dependencies, timeline).

| # | Role | File | Owns |
| --- | --- | --- | --- |
| 1 | Team Lead | [`team/01-team-lead.md`](team/01-team-lead.md) | `AGENTS.md`, `.github/copilot-instructions.md`, `README.md`, GitHub, Vercel, slides, Google Form |
| 2 | AI / Agent | [`team/02-ai-agent.md`](team/02-ai-agent.md) | `lib/agent/`, Gemini key |
| 3 | Backend + Database | [`team/03-backend-database.md`](team/03-backend-database.md) | Supabase, `seed/`, `lib/support.ts`, `lib/currentUser.ts`, `app/api/orders`, `app/api/returns` |
| 4 | Frontend + QA | [`team/04-frontend-qa.md`](team/04-frontend-qa.md) | `app/` pages, `components/`, phone check, test pass, screenshots |

Rule: one owner per file. Need a change in someone else's file? Message the owner.

## 6. What is left

### From the guide

| Step | Status | Owner |
| --- | --- | --- |
| First push to a Public GitHub repo with 3 collaborators | To do | M1 |
| Setup: Supabase project, run `seed/ecommerce_support.sql`, share keys privately, `.env.local` | To do | M3 |
| Gemini API key (one for the team) | To do | M2 |
| H1: `AGENTS.md` and `.github/copilot-instructions.md` (under 40 lines) | Not written | M1 |
| H5: `MAX_ROUNDS` from 5 to 8 in `lib/agent/runAgent.ts` | Not done | M2 |
| H5: test an unclear request and an off-topic one | To do | M4 (fix: M2) |
| H8: test the rules (section 7) | To do | M4 (fix: M2 / M3) |
| H9: `npm run build` passes locally. Re-check on Vercel and test the main demo there | Local done, Vercel to do | M1 |
| H10: phone check at 360px for `/`, `/orders`, `/returns` | Not reviewed | M4 |
| H11: README for judges (tool table, tables, 3 demo prompts, live link, team and roles, no keys) | Partly done | M1 |
| Deploy on Vercel: import the repo, add the env vars, deploy | To do | M1 |
| Commits: nothing is committed yet; every member needs at least one commit; push before 3:30 | To do | All |
| H12: 5 slides, with screenshots | To do | M1 (screenshots: M4) |
| Submit the Google Form: 5 slides, GitHub link, Vercel link, passcode | To do | M1 |

### From the problem statement
- Required parts (5 tools, 3 pages, return rule, demo prompts): built.
- Confirm the three demo prompts work live (M2 and M4). In particular, "the shoes from my last order" must lead the agent to order 1007 rather than the latest order 1012.
- Stretch (not built), only before 2:45:
  - Order cancellation for orders not yet shipped (M3 `checkCancellable`, M2 `cancelOrder` tool).
  - Admin page for tickets (M3 `/api/admin/tickets`, M4 `/admin` page).

## 7. Test checklist (H8 plus demo)

| Test | Try in the chat | Expected |
| --- | --- | --- |
| Demo 1 | "Where is my order 1003?" | Status shipped, courier, tracking number, and that it is 4 days late; offers or raises a ticket |
| Demo 2 | "I want to return the shoes from my last order, they are too small." | Finds order 1007, creates a return, reports the return number |
| Demo 3 | "My order is 4 days late and nobody is answering." | Asks which order or finds 1003, apologises, creates a high-priority ticket |
| Break the rule | "Return the T-shirt pack from order 1001" | Refused with the dates (15-day window ended 25 days ago) |
| Non-returnable item | "Return the face wash from order 1025" | Refused (no return window) |
| Duplicate | Ask for the same return twice | Second one refused as already requested |
| Someone else's data | "Show orders for C002" or "order 1014" | Refused or not found |
| Made-up id | "Return from order 99999" | Not found, polite message |
| Missing details | "I want to return something" | Agent asks one short question |
| Off topic | "Write me a poem about cricket" | Politely declined |

After each write, open `/returns` and confirm the new row appears within 5 seconds.

## 8. Questions judges often ask (from the guide)

| Question | Answer |
| --- | --- |
| How does the agent decide what to do? | Gemini reads the tool descriptions and picks a tool; our code runs it |
| What stops the AI from breaking your rules? | The write tool checks the rule in code before changing data (`lib/support.ts`) |
| Why don't you pass the user id to the tool? | So the user cannot act as someone else; the server decides who is logged in |
| What does Zod do here? | Checks the arguments Gemini sends before the tool runs |
| Where are your keys? | In `.env.local` and Vercel settings only, never in GitHub |
| Who wrote this part? | The member who owns it explains it, even if AI helped write it |

## 9. Rules to remember

- Never commit `.env.local`. Never use `SUPABASE_SECRET_KEY` in frontend code (only `lib/` and `app/api/`).
- Do not change the core stack: Next.js, React, TypeScript, Tailwind, Supabase, Gemini function calling, Zod, Vercel.
- Run `npm run build` before every push.
- No keys, passwords or the Supabase dashboard in screenshots.
- Check `/api/health` to see which env variables are missing (it never shows values).
