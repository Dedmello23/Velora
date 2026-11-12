# Velora: E-commerce Customer Support Agent (ShopEase)

An AI support agent for an online store. Customers can track orders, request returns and raise support tickets in a chat.

**Stack:** Next.js (App Router) · React · TypeScript · Tailwind CSS · Supabase PostgreSQL · Google Gemini API (function calling) · Zod · Vercel

## Setup

1. `npm install` (Node.js 20 or later).
2. Create a Supabase project. In **SQL Editor**, run `seed/ecommerce_support.sql` (safe to re-run; it resets its own tables).
3. Copy `.env.example` to `.env.local` and fill in the values (Supabase URL and secret key, Gemini API key, passcode settings).
4. `npm run dev`, open http://localhost:3000, enter the passcode.
5. Open `/api/health` to see which variables are missing (never their values).

Before pushing, run `npm run build`.

## Database

Tables: `customers`, `products`, `orders`, `order_items`, `returns`, `support_tickets`.
Demo customer: `C001` (Priya Raman).
Return rule: only for `delivered` orders, within `products.return_window_days` of `orders.delivered_date`.

## Folder guide

```
app/
  page.tsx               Support Chat (agent)
  orders/page.tsx        My Orders
  returns/page.tsx       My Returns + support tickets
  login/page.tsx         Passcode page
  api/agent/route.ts     POST /api/agent: runs the agent
  api/orders, api/returns  Read-only APIs for the pages
  api/health/route.ts    Shows which settings are missing
components/
  AgentChat.tsx          Chat UI that shows tool calls
lib/
  agent/tools.ts         getMyOrders, getOrderDetails, checkReturnEligibility,
                         createReturnRequest (writes), escalateToHuman (writes)
  support.ts             Return-policy check and order helpers (rules live in code)
  currentUser.ts         Logged-in customer id (C001)
  agent/systemPrompt.ts  Instructions for Gemini
  agent/runAgent.ts      The agent loop (max 5 rounds)
  agent/defineTool.ts    Turns Zod schemas into Gemini tool declarations
  supabase.ts            Server-side Supabase client
  schemas.ts             Shared Zod schemas
proxy.ts                 Passcode gate for every page and API
seed/ecommerce_support.sql   Tables and sample data
docs/                    Hackathon prompt handbook (PDF)
```

## Rules

- Never commit `.env.local`.
- Only files under `lib/` and `app/api/` may use `SUPABASE_SECRET_KEY`.
- Do not change the core stack.
