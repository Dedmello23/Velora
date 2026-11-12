# Team Plan: 4 members, 4 agents

Project: **Velora · ShopEase Customer Support Agent (PS1)**. Status and background: [`../PROJECT_STATUS.md`](../PROJECT_STATUS.md).

Each member has one file below. Open **your file in your own AI coding agent** (Copilot, Claude Code, Antigravity) and work through its prompts top to bottom. All prompts are already filled in. No `<angle brackets>` are left except where a file says "fill in".

| # | Role | File | Owns (only this member edits these) |
| --- | --- | --- | --- |
| 1 | Team Lead | [`01-team-lead.md`](01-team-lead.md) | `AGENTS.md`, `.github/copilot-instructions.md`, `README.md`, Vercel, GitHub repo, slides, Google Form |
| 2 | AI / Agent | [`02-ai-agent.md`](02-ai-agent.md) | `lib/agent/` (tools, system prompt, agent loop) |
| 3 | Backend + Database | [`03-backend-database.md`](03-backend-database.md) | `lib/support.ts`, `lib/currentUser.ts`, `app/api/orders`, `app/api/returns`, `seed/`, Supabase project |
| 4 | Frontend + QA | [`04-frontend-qa.md`](04-frontend-qa.md) | `app/page.tsx`, `app/orders/`, `app/returns/`, `components/`, `app/globals.css`, screenshots, test log |

Member names (fill in): 1 ______  2 ______  3 ______  4 ______

## File ownership = no Git conflicts

Two people editing the same file causes conflicts. If you need a change in someone else's file, **message the owner** with the exact change; do not edit it yourself.

Shared, read-only for everyone: `lib/supabase.ts`, `lib/env.ts`, `lib/auth.ts`, `lib/dates.ts`, `lib/schemas.ts`, `proxy.ts`, `package.json`.

## Dependencies between members

```
Member 3 (Supabase + seed + env)  ──►  everyone can run the app
Member 1 (first push, AGENTS.md)  ──►  everyone pulls and uses the rules file
Member 2 (tools)  ◄──►  Member 3 (support.ts rules)   they agree on helper names
Member 4 (pages)  ──►  needs Member 3's /api/orders and /api/returns (already built)
Member 2 + 3 finish  ──►  Member 4 runs the full test pass  ──►  Member 1 builds slides
```

## Working rules (from the handbook)

- `git pull` before you start. After each step that works: `git add .`, `git commit -m "<what you added>"`, `git push`.
- Every member must make at least one commit (the judges check `git log`).
- Run `npm run build` before every push.
- Never commit `.env.local`. Never put keys in screenshots or chat.
- Only one person types prompts into a shared screen at a time; swap every hour.
- Stop adding features at **2:45**. Code freeze at **3:30**.

## Timeline per member

| Time | M1 Lead | M2 AI | M3 Backend/DB | M4 Frontend/QA |
| --- | --- | --- | --- | --- |
| Now | Push code, AGENTS.md, share repo | Pull; review tools | Supabase + seed + `.env.local` | Pull; run app |
| By 12:30 | Vercel deploy started | **A tool works in chat** | DB verified | Pages load with data |
| 1:30 – 2:45 | README draft | Prompt tuning, MAX_ROUNDS | Rule tests, stretch API | Phone check, stretch page |
| 2:45 – 3:30 | Slides + README final | Fix refusals | Fix rules | Screenshots + test log |
| 3:30 – 4:00 | **Submit form** | Help check Vercel demo | Help check Vercel demo | Help check on phone |

## Stretch goals (only if the core is green before 2:45)

| Stretch | Owner of each part |
| --- | --- |
| Cancel an order that is not yet shipped | M2 `cancelOrder` tool and prompt · M3 rule helper in `lib/support.ts` · M4 add to test list |
| Admin page for tickets | M3 `app/api/admin/tickets` · M4 `app/admin/page.tsx` |
