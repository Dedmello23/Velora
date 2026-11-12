# Why We Use Groq Instead of Gemini

Project: **Velora · ShopEase Customer Support Agent (PS1)** · Team: ______ (team number ___)

## Summary

The hackathon starter recommends the Google Gemini API for the agent's function calling. Our team uses **Groq** as the LLM provider instead. Everything else in the recommended stack is unchanged: Next.js, React, TypeScript, Tailwind CSS, Supabase PostgreSQL, Zod and Vercel.

## Reasons

### 1. Google's free tier rate limits blocked our testing
- On the Gemini free tier we hit rate limits repeatedly while testing. By the team's count, requests were rejected on roughly 1 in every 5 attempts.
- Our agent makes **several model calls for one customer message**: the model picks a tool, our code runs it, and the result goes back to the model. A return request takes about 4 tool calls, so one chat message can use 4 or more requests.
- With four people sharing one free key, the limit is reached quickly. A failed call in the middle of a return leaves the user with an error instead of an answer.
- For a support chat, a rate-limit error at demo time is the worst possible failure.

### 2. Groq is much faster
- Support customers expect a quick answer. Each agent turn waits on several model calls one after another, so model speed adds up.
- Groq's responses were noticeably faster in our tests, which makes the chat feel instant and makes tool boxes appear as the agent works.
- Faster responses also make it easier for the team to test, since we run the same demo prompts many times.

### 3. Groq is developer friendly
- Simple API key setup, with no cloud project or billing setup needed to start.
- The API follows the common chat-completions style with tool (function) calling, so our tool design carries over: a name, a description, and a JSON schema for the arguments.
- Clear error messages, which helps when four people debug at the same time.

## What changes in the code, and what does not

| Part | Change |
| --- | --- |
| Tools (`lib/agent/tools.ts`), Zod schemas, `defineTool()` | **No change.** Tools are provider independent |
| Business rules (`lib/support.ts`) | **No change.** Rules are checked in our code, not by the model |
| Supabase, seed data, pages, APIs | **No change** |
| LLM client (`lib/gemini.ts`) and agent loop (`lib/agent/runAgent.ts`) | Switch to the Groq client and its message and tool-call format |
| Environment variables | Replace the Gemini key with the Groq key (set in `.env.local` and in Vercel) |

The agent loop stays the same: model picks a tool → Zod checks the arguments → our code runs it → the result goes back to the model → repeat until a final answer (with a round limit).

## Safety is not affected by the provider
- The model never touches the database. It can only ask for a tool; our server validates the arguments with Zod and runs the tool.
- The return policy (delivered orders only, inside the product's return window, no duplicate returns, own orders only) is enforced in code, so a different model cannot break it.
- No tool takes a user id. The logged-in customer (C001) is set by the server.
- The API key is read on the server only and is never committed or sent to the browser.

## Honest trade-offs
- The handbook says "Do not change the core stack". We changed only the LLM provider and kept the architecture it describes (function calling, Zod validation, Supabase, Next.js, Vercel). We are documenting the reason here.
- Groq's free tier also has its own rate limits. We chose it because it was faster and easier for us in practice, not because it has no limits.
- Different models can pick tools slightly differently, so we re-test all demo prompts and refusals after the switch.

## Evidence to attach (fill in before submitting)

| Item | Value |
| --- | --- |
| Gemini model tried | |
| Rate-limit error seen (exact message) | |
| Failed requests out of attempts | e.g. 1 of 5 |
| Groq model used | |
| Time for the demo prompt "Where is my order 1003?" on Gemini | |
| Time for the same prompt on Groq | |
| Date and who measured | |

## Status
- [ ] Code switched to Groq (as of writing, the repository still contains the Gemini client; see `lib/gemini.ts` and `package.json`).
- [ ] Groq key added to `.env.local` and to Vercel.
- [ ] Demo prompts and refusal tests re-run on Groq.
- [ ] README and slides say "Groq", not "Gemini".
