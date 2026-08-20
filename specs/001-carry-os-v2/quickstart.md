# Quickstart validation: CarryOS v2

## Prerequisites

- Node.js 20+
- `npm ci`
- Optional: `.env.local` with `OPENAI_API_KEY` and `OPENAI_MODEL` (fallback works without them)
- `NEXT_PUBLIC_GITHUB_REPOSITORY_URL` optional

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Core scenarios

1. Open `/`: headline, CTA, source link, simulation disclosure, hero states from domain engine.
2. Open `/demo`: no login. Close bag. Calculator not detected. One alert. Add calculator. Rescan. Ready for Calculus II.
3. Submit AI form without credentials: labeled deterministic fallback. Approve/reject does not change readiness until approval.
4. Arm failed scan: no Ready, no missing-item notification from the failed scan.
5. Valid scan then open bag: Stale, Ready withdrawn.
6. Reset: canonical Calculus II scenario restored.

Expected leave-by for the demo clock: 8:35 AM America/Chicago.

Do not call a live model from automated tests. Inject a fake provider.
