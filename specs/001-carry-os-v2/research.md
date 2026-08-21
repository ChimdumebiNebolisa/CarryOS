# Research: CarryOS v2

> Historical planning record. The authoritative implementation is the Next.js v2 application now present in this repository; references below to creating a separate repository describe the superseded planning assumption, not the reachable architecture.

## Decision: Next.js App Router in a new repository

**Rationale**: Approved PRD. Existing CarryOS is Vite + monolithic UI and must remain read-only.

**Alternatives considered**: Rebuild in current CarryOS (rejected: not greenfield; PRD forbids modification). Keep Vite (rejected: PRD requires App Router).

## Decision: Independently reimplement visual references

**Rationale**: Hero Section 9 and Flux Card Hero are composition references. Direct code reuse is allowed only after license verification. Conservative default: no third-party source copy.

**Alternatives considered**: Copy 21st.dev source (rejected until license verified). Invent a third visual language (rejected: one system, two references).

## Decision: Reimplement domain algorithms; do not copy UI

**Rationale**: v1 domain semantics are the acceptance oracle. v1 UI, orbit experiments, ShadcnSpace Pro, and monolithic CSS are prohibited. Alert type transitions MUST update the existing unresolved alert (PRD FR-09), which v1 implemented as expire-and-create.

**Alternatives considered**: Port `App.tsx` (rejected). Keep v1 expire-and-recreate alerts (rejected: contradicts PRD).

## Decision: Item IDs and activity types follow the PRD

**Rationale**: `charger` not `charger-strap`. Activity type `exam-lab` not `exam`. Exam/lab required items: notebook, calculator, student-id, keys.

**Alternatives considered**: Preserve v1 fixture IDs (rejected: PRD is authoritative).

## Decision: Confirmed requires test location hint is not `outside`

**Rationale**: PRD 12.3. Missing or `inside` or `unknown` hints may confirm if other thresholds pass. `outside` never confirms.

**Alternatives considered**: v1 required `locationHint === 'inside'` (stricter than PRD; not required).

## Decision: OpenAI Responses API behind a provider interface

**Rationale**: One bounded server-side inference. Zod/JSON Schema validation. One schema-repair retry then fallback. Tests inject a fake provider.

**Alternatives considered**: Client-side OpenAI (rejected: secret exposure). Direct route-to-OpenAI with no interface (rejected: PRD provider boundary).

## Decision: Per-instance in-memory rate limiter

**Rationale**: PRD allows dependency-light limiter for local/preview. Document distributed enforcement as residual risk.

**Alternatives considered**: Redis/Upstash (rejected: extra infra, possible paid service).

## Decision: shadcn/ui primitives only

**Rationale**: Button, dialog/drawer, badge, separator, and similar controls. No component marketplace soup. Motion for React for state-stack and toasts. Lucide for icons.

**Alternatives considered**: Custom CSS-only (slower, more risk). Additional visual registries (forbidden).

## Decision: Default source URL is the v1 public repository

**Rationale**: Clarification session. `NEXT_PUBLIC_GITHUB_REPOSITORY_URL` defaults to `https://github.com/ChimdumebiNebolisa/CarryOS`. Do not invent a live demo URL.

**Alternatives considered**: Leave source link empty (worse for reviewers).

## Decision: Hero reduced-motion shows stable Missing

**Rationale**: Clarification session and PRD 16.9.

## Decision: No screenshot-to-design-system unless StyleSeed cannot resolve a control token

**Rationale**: PRD specialist table.
