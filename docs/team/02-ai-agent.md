# Member 2 · AI / Agent

**Name:** ______  **Handbook prompts:** H3, H4, H5 · **Back to:** [team plan](README.md)

## You own
Everything in `lib/agent/`: `tools.ts`, `systemPrompt.ts`, `runAgent.ts`, `defineTool.ts`, `types.ts`. Also the team's **Gemini API key** (Google AI Studio → Get API key; one key for the team).
Do **not** edit `lib/support.ts` (Member 3) or `app/`, `components/` (Member 4). If a rule needs to change, ask Member 3.

## Where things stand
The 5 tools, the system prompt and the return rule already exist and compile (`npm run build` passes) but have **never run against Gemini**. Your job is to make them work for real and tune the behaviour.

## Checklist

- [ ] **T1.** `git pull`, put the Gemini key in `.env.local`, `npm run dev`, log in.
- [ ] **T2. By 12:30: a tool works in chat.** Send "Where is my order 1003?" and click the grey tool box to see the arguments Gemini chose. Tell the mentor if it does not work before lunch.
- [ ] **T3. MAX_ROUNDS 5 → 8** (a return needs about 4 tool calls). Prompt below.
- [ ] **T4. Run the 3 demo prompts** and fix whatever fails (prompt below).
- [ ] **T5. Refusal tuning (H8 with M4).** Fix any test M4 reports as not refused.
- [ ] **T6. Stretch (only before 2:45):** `cancelOrder`. Prompt below; needs M3's helper first.
- [ ] Commit after each step: `git add . && git commit -m "<what>" && git push`.

## Prompt T3: more rounds

```
In #file:lib/agent/runAgent.ts change MAX_ROUNDS from 5 to 8.
```

## Prompt T4: demo prompt fixing

Run each demo prompt in the chat. If one fails, paste this with the blanks filled in:

```
In my app, when the user types "<THE PROMPT>", the agent <WHAT HAPPENED>. It should <WHAT SHOULD HAPPEN>.
Check the tool descriptions and rules in #file:lib/agent/tools.ts and #file:lib/agent/systemPrompt.ts and
fix them. Do not change lib/support.ts. Tools must never take a customer id.
```

Expected behaviour:

| Prompt | Expected |
| --- | --- |
| "Where is my order 1003?" | Calls `getOrderDetails`; says shipped, courier, tracking, **4 days late**; offers or raises a ticket |
| "I want to return the shoes from my last order, they are too small." | `getMyOrders` → sees shoes are in order **1007** (not the newest order 1012) → `checkReturnEligibility` → `createReturnRequest` with the reason → reports the return id |
| "My order is 4 days late and nobody is answering." | Finds the late order (1003), apologises, `escalateToHuman` with priority **high**, reports the ticket id |

## Prompt T6 (stretch): cancel an order

Only after M3 confirms `checkCancellable(orderId)` exists in `lib/support.ts`:

```
In #file:lib/agent/tools.ts add a write tool cancelOrder (writes: true). Args: order_id (positive int).
Call checkCancellable(order_id) from #file:lib/support.ts; if it is not cancellable, throw new
Error(reason). Otherwise update orders set status = 'cancelled' for that order and return the order id and
new status. Description: "Use this when the customer wants to cancel an order that has not shipped yet."
Add it to the tools array. In #file:lib/agent/systemPrompt.ts add one line: cancellation is only allowed
for orders with status placed; for shipped orders suggest a return after delivery.
```

## Check before you accept any AI change
- Table and column names match `seed/ecommerce_support.sql`.
- No tool takes a customer id.
- The new tool is in the `tools` array, and write tools have `writes: true`.
- `npm run build` passes.

## Hand-offs
- To **M1:** final tool names and read/write list (for README and slides).
- To **M4:** the final demo prompts (for sample prompts and screenshots).
- From **M4:** any prompt that was not refused → T5.
