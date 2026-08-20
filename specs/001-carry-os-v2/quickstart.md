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

1. Open `/`: headline, source link, explanatory sections, and the landing proof derived from the domain engine.
2. Open `/demo`: no login. Close bag. Notebook is not detected and one actionable alert appears. Add Notebook. Rescan. Ready for Algorithms.
3. Submit AI form without credentials: labeled deterministic fallback. Approve/reject does not change readiness until approval.
4. Arm failed scan: no Ready, no missing-item notification from the failed scan.
5. Valid scan then open bag: Stale, Ready withdrawn.
6. Reset: the canonical Algorithms scenario and all transient UI state are restored.

Expected leave-by for the 9:21 AM demo clock: 9:35 AM America/Chicago.

Do not call a live model from automated tests. Inject a fake provider.
