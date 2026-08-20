# Carry less uncertainty.

Carry is a software-first intelligence layer for a backpack. It connects upcoming event context, user-approved item requirements, simulated RFID observations, uncertainty-aware inventory memory, and leave-by timing into proactive, evidence-backed warnings.

## Live demo

Deployment is not part of this bootstrap. Run locally:

```bash
npm ci
npm run dev
```

Open the URL Next.js prints. `/` is the public landing page. `/demo` is the full technical workspace. No login is required.

## What is real

- Deterministic inventory states: Confirmed, Probable, Not detected, Unknown, and Stale.
- Ready only when every required item is confirmed by a recent valid closed-bag scan.
- One bounded model feature: suggest which registered items an event may require.
- Explicit approval before suggestions change an activity checklist.
- Deterministic fallback when `OPENAI_API_KEY` is absent.

RFID input is simulated. Carry does not claim physical reader validation.

## AI boundary

The model cannot decide sensor observations, inventory presence, staleness, readiness, alert resolution, or travel time.

## Environment

Copy `.env.example` to `.env.local`:

```text
OPENAI_API_KEY=
OPENAI_MODEL=
NEXT_PUBLIC_GITHUB_REPOSITORY_URL=https://github.com/ChimdumebiNebolisa/CarryOS
```

Never prefix secrets with `NEXT_PUBLIC_`.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

## Architecture

See [docs/architecture.md](docs/architecture.md). Hardware future work is in [docs/hardware-plan.md](docs/hardware-plan.md). The 60-second script is in [docs/demo-script.md](docs/demo-script.md).
