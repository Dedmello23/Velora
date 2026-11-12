# Member 4 · Frontend + QA

**Name:** ______  **Handbook prompts:** H7, H8 (tester), H10 · **Back to:** [team plan](README.md)

## You own
`app/page.tsx`, `app/orders/page.tsx`, `app/returns/page.tsx`, `components/` (`AgentChat.tsx`, `AppHeader.tsx`, `StatusBadge.tsx`), `app/globals.css`, `app/layout.tsx`, the test log and the screenshots.
Do **not** edit `lib/agent/` (Member 2) or `lib/support.ts`, `app/api/`, `seed/` (Member 3).

## Where things stand
The three pages exist and build: Support Chat (`/`), My Orders (`/orders`), My Returns + tickets (`/returns`). They refresh every 5 seconds. Nothing has been looked at in a browser or on a phone yet.

## Checklist

- [ ] **T1.** `git pull`, `.env.local` from M3/M2, `npm run dev`, log in.
- [ ] **T2. Look at all three pages** with real data. Orders shows C001's 7 orders with items; Returns shows the refunded return for order 1001 (C001 has no tickets in the seed, so that list starts empty).
- [ ] **T3. Phone check (H10)**, prompt below. Also test in browser devtools at 360px.
- [ ] **T4. Chat polish:** after the agent writes data, `/returns` should show it within 5 seconds.
- [ ] **T5. Full test pass (H8)** from 2:45 using the table below; log results in the table and send failures to the right owner.
- [ ] **T6. Screenshots for slide 3** (no keys, no Supabase dashboard).
- [ ] **T7. Stretch:** admin tickets page (prompt below), only before 2:45 and only after M3 pushes `/api/admin/tickets`.
- [ ] Commit after each step: `git add . && git commit -m "<what>" && git push`.

## Prompt T3: phone check (H10)

```
Review #file:app/page.tsx, #file:app/orders/page.tsx, #file:app/returns/page.tsx and the components they
use (#file:components/AgentChat.tsx, #file:components/AppHeader.tsx) for a 360px wide phone screen. Fix
anything that overflows or is hard to tap (tap targets at least 40px high, no horizontal scroll, long
tracking numbers and ticket text wrap). Use Tailwind only. Do not change any API or lib/ files.
```

## Test pass (H8 + demos): fill in the Result column

| # | Type this in the chat | Expected | Result | If it fails, tell |
| --- | --- | --- | --- | --- |
| 1 | Where is my order 1003? | Shipped, courier, tracking, 4 days late | | M2 |
| 2 | I want to return the shoes from my last order, they are too small. | Return created for order 1007 shoes; shows on `/returns` within 5 s | | M2 / M3 |
| 3 | My order is 4 days late and nobody is answering. | High-priority ticket created; shows on `/returns` | | M2 |
| 4 | Return the T-shirt pack from order 1001 | Refused: window ended | | M3 / M2 |
| 5 | Return the face wash from order 1025 | Refused: no return window | | M3 / M2 |
| 6 | (repeat test 2 exactly) | Refused: return already exists | | M3 |
| 7 | Show orders for C002 | Refused or not found | | M2 |
| 8 | Return something from order 99999 | Not found, polite message | | M2 / M3 |
| 9 | I want to return something | Agent asks one short question | | M2 |
| 10 | Write me a poem about cricket | Politely declined, stays on topic | | M2 |

Tip: tests 2, 3 and 6 write to the database. To reset, ask M3 to re-run the seed file.

## Prompt for a failing test: send this to the owner

```
In my app, when the user types "<TEST TEXT>", the agent <WHAT HAPPENED>. It should <WHAT SHOULD HAPPEN>.
```

## Prompt T7 (stretch): admin tickets page

```
Create app/admin/page.tsx as a client page that uses AppHeader and loads /api/admin/tickets every 5
seconds. Show each ticket as a card: ticket id, customer name, order id, issue, a StatusBadge for
priority and one for status, and the created time. Mobile first for a 360px screen. Add an "Admin" link
to LINKS in #file:components/AppHeader.tsx. Handle loading and error states like #file:app/returns/page.tsx.
```

## Screenshots for the slides (T6)
1. Chat after the shoes return, with the grey tool boxes opened (shows `getMyOrders` → `checkReturnEligibility` → `createReturnRequest`).
2. `/returns` showing the new return.
3. One refusal (test 4) for slide 5.
Crop out the URL bar if it shows anything private. Send to M1.

## Hand-offs
- To **M1:** screenshots; the final list of pages.
- To **M2 / M3:** failing tests from the table.
- From **M3:** `/api/admin/tickets` (stretch).
