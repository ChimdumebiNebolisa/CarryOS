# Implementation Plan: CarryOS v2

**Branch**: `001-carry-os-v2` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-carry-os-v2/spec.md`

## Summary

Rebuild Carry as a Next.js App Router product that connects event context, user-approved requirements, simulated RFID observations, uncertainty-aware inventory belief, and leave-by timing into evidence-backed intervention. The public landing page and `/demo` share one domain engine. One server-side model endpoint may suggest registered items; users approve; deterministic code decides readiness.

## Technical Context

**Language/Version**: TypeScript 5.x, strict mode, React 19, Node.js 20+

**Primary Dependencies**: Next.js App Router (current stable), Tailwind CSS v4, shadcn/ui (selective primitives), Motion for React, Lucide React, Zod, Vitest, React Testing Library, Playwright

**Storage**: None. In-memory client session only. No database.

**Testing**: Vitest unit/integration, React Testing Library component tests, Playwright e2e. API tests use injected fake providers; never live model calls.

**Target Platform**: Vercel-compatible web app. Local `next dev` / `next start`. No production deploy during bootstrap.

**Project Type**: Single Next.js web application (App Router) with one Route Handler.

**Performance Goals**: No WebGL/Spline/Three/canvas particles/video hero. Pause offscreen animation. Lighthouse desktop ≥90 / mobile ≥80 as targets, not hard blockers if explained. CLS < 0.1. No horizontal overflow at 1440/768/390/320.

**Constraints**: No auth, no persistence, no real RFID/Maps. Secrets server-only. 8 KB request body, field length limits, provider timeout, one schema-repair retry, per-instance rate limit. MIT license.

**Scale/Scope**: One user, one backpack, 8 items, 3 activities, 2 routes + 1 API, 7 landing sections max.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Evidence before confidence | PASS | Ready requires current-scan provenance and registered supporting observations; failed/stale/unknown/malformed state cannot be Ready |
| Belief, not database truth | PASS | Five inventory states; bag-open invalidates freshness |
| AI proposes, users approve, evidence decides | PASS | Route Handler validates; approval is client workflow; model cannot mutate sensor/readiness |
| Deterministic domain independence | PASS | `src/domain/*` has no Date.now/Math.random/React/network |
| Visible simulation | PASS | Simulated RFID labeled; no fake Maps adapter |
| Shared proof engine | PASS | Landing reconciliation proof and demo share the application/domain scenario; the hero is intentionally a static product illustration |
| One visual system | PASS | Two 21st.dev references only; independently reimplemented |
| No fake completeness | PASS | Fallback labeled; no testimonials/metrics/hardware photography |
| Verification | PASS | Unit, API, component, integration, e2e, CI required |
| Scope discipline | PASS | No DB/auth/RFID/Maps/payments/deploy |
| Security | PASS | Server-only key, Zod validation, timeout, throttle, no HTML execution of model text |

Post-design re-check: PASS. Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-carry-os-v2/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── carry-profile.md
├── checklists/
│   ├── requirements.md
│   └── requirements-quality.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
  app/
    page.tsx
    demo/page.tsx
    api/carry-profile/route.ts
    layout.tsx
    globals.css
  components/
    marketing/
    demo/
    ui/
  domain/
    inventory.ts
    readiness.ts
    alerts.ts
    carry-profile.ts
    timing.ts
    types.ts
  application/
    demo-scenario.ts
    notification-policy.ts
    trace.ts
  adapters/
    inventory/simulated-rfid.ts
    travel/simulated-travel.ts
    ai/openai-provider.ts
    rate-limit/rate-limiter.ts
  fixtures/
    activities.ts
    items.ts
    demo-scenario.ts
  lib/
    env.ts
    ids.ts
    clock.ts
    utils.ts

tests/
  unit/
  integration/
  e2e/

docs/
  architecture.md
  hardware-plan.md
  v1-behavior-map.md
  demo-script.md
  acceptance-matrix.md
```

**Structure Decision**: Single Next.js App Router project matching the PRD tree. Domain is framework-independent. Route Handler is the only server mutation/network boundary.

## Complexity Tracking

> No constitution violations requiring justification.
