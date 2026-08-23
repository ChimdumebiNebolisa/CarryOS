# Carry repository instructions

Carry is a software-first, single-user backpack inventory prototype. It connects upcoming event context, user-approved item requirements, simulated RFID observations, uncertainty-aware inventory memory, and departure timing into proactive, evidence-backed intervention.

## Stack

Next.js App Router, React, TypeScript strict mode, Tailwind CSS v4, selective shadcn/ui primitives, Motion for React, Lucide React, Zod, Vitest, Playwright.

## Important directories

- `src/domain/` deterministic inventory, readiness, alerts, timing, carry-profile validation
- `src/application/` demo scenario, notifications, trace
- `src/adapters/` simulated RFID, simulated travel, model provider, rate limiter
- `src/app/` routes and the carry-profile Route Handler
- `src/components/site/` homepage hero and architecture page
- `src/components/demo/` secondary technical workspace
- `tests/` unit, integration, and e2e

## Commands

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:e2e`

## Environment

Server-only: `OPENAI_API_KEY`, `OPENAI_MODEL`, optional `OPENAI_BASE_URL`.
Public: `NEXT_PUBLIC_GITHUB_REPOSITORY_URL`.
Never put secrets on `NEXT_PUBLIC_`.

## Invariants

- Domain functions must not call `Date.now()`, `Math.random()`, React, or network APIs.
- Failed, stale, unknown, or incomplete evidence cannot produce Ready.
- AI output is untrusted. Validate it, require approval, and never let it mutate sensor state or readiness.
- Simulated RFID must remain labeled as simulated.
- `/` is presentation-only. `/how-it-works` explains architecture. `/demo` must keep using the domain engine.
- Browser notification permission is requested only after an explicit user action.

## Specialist activation

- `frontend-design`: substantial new visual direction.
- StyleSeed: respect `STYLESEED.md` for substantial visual work.
- Vibe Security: consult before changing the AI endpoint, secrets, validation, or rate limits.
- Code Review Expert: review-only; the implementing agent applies required fixes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
