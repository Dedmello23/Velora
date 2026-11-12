# Member 1 · Team Lead

**Name:** ______  **Handbook prompts:** H1, H2, H11, H12 · **Back to:** [team plan](README.md)

## You own
`AGENTS.md` · `.github/copilot-instructions.md` · `README.md` · GitHub repo · Vercel project · 5 slides · Google Form.
Do **not** edit `lib/agent/`, `lib/support.ts`, `app/`, `components/` or `seed/` (other owners).

## Checklist

- [ ] **T1. First push (do this first, everyone waits for it).** Make the repo **Public**, add the 3 teammates as collaborators, then:
  `git add . && git commit -m "ShopEase support agent: tools, pages, docs" && git push`
  Tell the team to `git pull`.
- [ ] **T2. AGENTS.md (H1)**, paste the prompt below into your agent.
- [ ] **T3. Vercel deploy.** Vercel → import the repo → add every variable listed in `.env.example` (open `/api/health` after deploy to see any that are missing) → Deploy. Get the values from M3 (Supabase) and M2 (Gemini key) privately, not in chat history that others can see publicly.
- [ ] **T4. Show the plan to the mentor (H2)** and confirm: ≥2 tools, ≥1 writes, no tool takes a user id.
- [ ] **T5. README (H11)**, after M2 and M3 report their tools are final.
- [ ] **T6. Slides (H12)**, from 2:45, with M4's screenshots.
- [ ] **T7. Submit the Google Form** between 3:30 and 4:00.

## Prompt T2: rules file (H1)

```
Read #file:seed/ecommerce_support.sql and #file:lib/agent/tools.ts and create AGENTS.md in the project
root (and copy the same text to .github/copilot-instructions.md) for our hackathon project.
Problem: PS1 E-commerce Customer Support Agent (ShopEase). Business user: a ShopEase customer.
Logged-in user id: C001 (Priya Raman).
Include, as short bullet points:
- The stack: Next.js App Router, TypeScript, Tailwind, Supabase (server only, secret key), Gemini
  function calling, Zod.
- The exact table names and their main columns from the seed file.
- Agent tools live in lib/agent/tools.ts and use defineTool() with a Zod schema; descriptions start with
  "Use this when...".
- The logged-in user id comes from lib/currentUser.ts. Never take a user id as a tool argument.
- Our business rule: a return is allowed only for delivered orders, within the product's
  return_window_days from delivered_date. It is checked in lib/support.ts (checkEligibility), in code.
- File ownership: lib/agent/ = AI member; lib/support.ts, app/api, seed/ = backend/database member;
  app/page.tsx, app/orders, app/returns, components/ = frontend member.
- Never use the Supabase secret key in components. Never commit .env.local.
Keep it under 40 lines.
```

Check: table names match the seed file exactly. Then `git add . && git commit -m "Add AGENTS.md rules file" && git push`.

## Prompt T5: README for judges (H11)

Fill the three blanks first (team names/roles, Vercel URL), then paste:

```
Rewrite README.md for our hackathon project. Keep it short and in plain English. Do not include any keys.
Problem: customers of the ShopEase online store ask the same questions all day (where is my order,
can I return this, my order is late) and wait hours. Users: ShopEase customers (demo user C001, Priya Raman).
Live link: <PASTE VERCEL URL>.
List our agent tools in a table (name, reads or writes, what it does) using #file:lib/agent/tools.ts,
our tables using #file:seed/ecommerce_support.sql, and these 3 demo prompts:
"Where is my order 1003?", "I want to return the shoes from my last order, they are too small.",
"My order is 4 days late and nobody is answering."
Also list the business rule and one refused example (return from order 1001 is outside its window).
Team: <NAME - ROLE>, <NAME - ROLE>, <NAME - ROLE>, <NAME - ROLE>.
Keep the setup steps and folder guide that are already there.
```

Commit: `git commit -m "Add README"`.

## Prompt T6: slide text (H12), use in ChatGPT or Gemini

```
Write the text for 5 presentation slides for our hackathon project. Plain English, at most 5 short bullet
points per slide.
Project: Velora (ShopEase Customer Support Agent), problem PS1. Team: <NAMES AND ROLES>.
Problem: A ShopEase customer has this problem: support answers the same questions all day (where is my
order, can I return this, my order is late) and customers wait hours.
What our app does: A chat where the customer asks in plain English. The agent checks the order, explains
its status, starts a return when the policy allows it, and raises a ticket for a human when it cannot help.
Our agent tools: getMyOrders (reads), getOrderDetails (reads), checkReturnEligibility (reads),
createReturnRequest (writes), escalateToHuman (writes).
Business rules our app checks: returns only for delivered orders within the product's return window;
no duplicate returns; the customer only sees their own orders; the user id is never passed to a tool.
Demo prompt that works: "I want to return the shoes from my last order, they are too small."
A request it refuses: a return from order 1001 (outside the 15-day window).
Links: GitHub <REPO URL>, live app <VERCEL URL>.
Slides: 1 Title and team, 2 The problem, 3 Our solution and demo, 4 How the agent works, 5 Results and links.
```

Then check every line is true. Slide 3 needs **2 screenshots from M4** (chat with tool boxes open, and `/returns` after a change). Slide 2 can use numbers from the seed: 100 orders, 8 customers, 30 products.

## Form checklist (T7)

- [ ] 5 slides: PDF or Google Slides link set to *Anyone with the link can view*
- [ ] GitHub link opens in an incognito window (repo is Public)
- [ ] Vercel link opens on a phone and the passcode works
- [ ] Main demo prompt works on the Vercel link, not only localhost
- [ ] Team number, problem number (PS1), names and roles
- [ ] App passcode (`APP_PASSCODE` from `.env.local`) so judges can log in
- [ ] Every member has ≥1 commit in `git log`

## Judge Q&A (rehearse with the team)

| Question | Answer |
| --- | --- |
| How does the agent decide what to do? | Gemini reads the tool descriptions and picks a tool; our code runs it |
| What stops the AI from breaking your rules? | The write tools check the rule in code (`lib/support.ts`) before changing data |
| Why don't you pass the user id to the tool? | So the user cannot act as someone else; the server decides who is logged in |
| What does Zod do here? | Checks the arguments Gemini sends before the tool runs |
| Where are your keys? | `.env.local` and Vercel settings only |
