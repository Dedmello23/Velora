# Velora: ShopEase Customer Support Agent

SRM Agentic AI Hackathon, **Problem Statement 1: E-commerce Customer Support Agent**.

**Live app:** https://velora-nine-neon.vercel.app/login (ask the team for the passcode)

## Problem

ShopEase customers keep contacting support to ask where their order is, to return a product, or to complain about a late delivery. Each of these needs someone to look up the order, check the store's return rules and write a ticket by hand.

**Users:** a ShopEase customer (the demo customer is Priya Raman, `C001`).

## What it does

Velora is a chat assistant named Asha. The customer types in plain words and the agent:

- finds the customer's orders and says where they are, including how many days late
- checks the return rules and creates a return request when the rules allow it
- refuses a return that breaks a rule and gives the exact reason
- raises a support ticket for late orders, with a higher priority when the delay is 3 days or more
- shows existing returns and tickets

The chat shows every tool the agent used. The Orders and Returns pages show the data change right after the agent writes.

## Agent tools

The model chooses the tool and its arguments. Our code validates the arguments with Zod and runs the tool. The model never touches the database.

| Tool | Type | What it does |
|---|---|---|
| `getMyOrders` | Read | Lists the customer's orders with status, courier, tracking number and expected date |
| `getOrderDetails` | Read | One order with its items and any returns |
| `checkReturnEligibility` | Read | Checks a product in an order against the return rules |
| `getMyReturns` | Read | The customer's return requests and their status |
| `getMyTickets` | Read | The customer's support tickets |
| `getReturnPolicy` | Read | Return windows per product or category, read from the products table |
| `createReturnRequest` | **Write** | Inserts a row into `returns` after the rules pass |
| `escalateToHuman` | **Write** | Inserts a row into `support_tickets` (skips a duplicate open ticket for the same order) |

No tool takes a customer id. The logged-in customer comes from `lib/currentUser.ts`, so the agent cannot act for someone else.

## Business rules (checked in code, not only in the prompt)

A return is allowed only when all of these are true:

- the order belongs to the logged-in customer
- the product is part of that order
- the order is `delivered`
- today is within the product's `return_window_days` of `delivered_date` (a window of 0 days means it cannot be returned)
- the product has no active return already (a rejected return does not count)

If a rule fails, the write tool throws an error before anything is saved, and the agent explains the reason in plain words.

## Demo prompts

1. `Where is my order 1003?` reads the order and gives status, courier, tracking and the expected date.
2. `I want to return the shoes from my last order, they are too small.` finds the right order and creates a return.
3. `My order is 4 days late and nobody is answering.` apologises and raises a high-priority ticket.

A request the agent refuses: returning a product after its return window has ended. It gives the delivery date and the last day it could have been returned.

## Tables (Supabase PostgreSQL)

`customers`, `products`, `orders`, `order_items`, `returns`, `support_tickets`. The seed file is `seed/ecommerce_support.sql`.

## Tech stack

Next.js (App Router), React, TypeScript, Tailwind CSS, Supabase PostgreSQL, Groq API with function calling (`openai/gpt-oss-120b`), Zod, Vercel.

## How it works

```
Customer message -> /api/agent -> Groq picks a tool -> Zod checks the arguments
-> our tool runs against Supabase -> result goes back to Groq -> final reply and the list of tools used
```

The agent loop is in `lib/agent/runAgent.ts`, the tools in `lib/agent/tools.ts`, and the business rules in `lib/support.ts`.

## Run it locally

1. `npm install` (Node.js 20 or later).
2. Create a Supabase project and run `seed/ecommerce_support.sql` in the SQL Editor.
3. Copy `.env.example` to `.env.local` and fill in the Supabase URL and secret key, the Groq API key and the passcode.
4. `npm run dev`, then open http://localhost:3000 and enter the passcode.
5. Open `/api/health` to see which settings are missing (it never shows their values).

Run `npm run build` before every push. Keys live only in `.env.local` and the Vercel settings, never in GitHub.

## Folder guide

```
app/                    Pages: chat (/), orders, returns, login, admin
app/api/agent           POST /api/agent runs the agent
app/api/orders|returns  Read-only APIs for the pages
components/             Chat UI and shared UI pieces
lib/agent/              Tools, system prompt, agent loop
lib/support.ts          Return rules and order helpers
lib/policy.ts           Return policy lookup
proxy.ts                Passcode gate for every page and API
seed/                   Tables and sample data
docs/                   Handbook and project notes
```

## Team

| Name | Register number | Role |
|---|---|---|
| Dhanush S | RS2411003010125 | Team Lead |
| Aarya A | RA2411003010372 | Agent integration |
| Aanya Raj | RA2411003010364 | Backend and database |
| Muhil S A | RA2411003010332 | Frontend |
