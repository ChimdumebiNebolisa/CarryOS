# Carry less uncertainty.

Carry is a software-first intelligence layer for a backpack. It connects upcoming event context, user-approved item requirements, simulated RFID observations, uncertainty-aware inventory memory, and leave-by timing into proactive, evidence-backed warnings.

## Live demo

Deployment is not part of this bootstrap. Run locally:

```bash
npm ci
npm run dev
```

Open the URL Next.js prints.

- `/` is a single-screen editorial poster. It does not scroll. The two actions are **How it works** and **Source code**.
- `/how-it-works` is the interactive architecture viewer: a React Flow system graph with per-subsystem explanations.
- The GitHub source link uses `NEXT_PUBLIC_GITHUB_REPOSITORY_URL`.
- `/demo` still exists as a secondary technical workspace. It is not linked from the homepage.

No login is required.

## What is real

- Deterministic inventory states: Confirmed, Probable, Not detected, Unknown, and Stale.
- Ready only when every required item has one valid state derived from the latest successful closed-bag scan and that scan's registered supporting observations.
- One bounded model feature: suggest which registered items the current Algorithms event may require.
- Explicit approval before suggestions change an activity checklist.
- Deterministic fallback when `OPENAI_API_KEY` is absent.

RFID input is simulated. Carry does not claim physical reader validation.

The demonstration starts at the canonical 9:21 AM scenario time and then advances from an injected clock. Reset returns it to 9:21 AM. Snoozed alerts are reevaluated at their absolute deadline.

## AI boundary

The model cannot decide sensor observations, inventory presence, staleness, readiness, alert resolution, or travel time.
The `/demo` generator submits the current fixed Algorithms context; it is not a general event-entry form.

## Environment

Copy `.env.example` to `.env.local`:

```text
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_BASE_URL=https://api.openai.com/v1/responses
TRUST_PROXY=false
NEXT_PUBLIC_GITHUB_REPOSITORY_URL=https://github.com/ChimdumebiNebolisa/CarryOS
```

Never prefix secrets with `NEXT_PUBLIC_`.

Set `TRUST_PROXY=true` only when a trusted reverse proxy overwrites forwarding headers. Vercel deployments enable trusted-proxy handling automatically.

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

See [docs/architecture.md](docs/architecture.md). Hardware future work is in [docs/hardware-plan.md](docs/hardware-plan.md). The 60-second script is in [docs/demo-script.md](docs/demo-script.md). Hero photo licensing is in [docs/image-credits.md](docs/image-credits.md).
