<!--
Sync Impact Report
- Version change: none → 1.0.0
- Modified principles: none (initial ratification)
- Added sections: Core Principles (I–X), Security and Privacy Constraints,
  Architecture and Scope Boundaries, Governance
- Removed sections: none
- Follow-up TODOs: none
-->

# CarryOS Constitution

## Core Principles

### I. Evidence Before Confidence
Carry MUST NOT claim an item is present without valid supporting evidence.
A failed, unavailable, stale, incomplete, or missing-state scan MUST NOT
produce Ready. Inventory confidence is a demonstration policy value, not a
trained probability, calibrated RFID probability, model confidence, or
guarantee.

**Rationale:** Reviewers and users must be able to inspect why the product
claims a physical fact. Overstating certainty is a product failure.

### II. Belief, Not Database Truth
Physical facts can stop being true without a direct observation of the
change. Carry MUST represent `confirmed-present`, `probably-present`,
`not-detected`, `unknown`, and `stale`. Opening the bag after a valid scan
MUST invalidate freshness. Optional items MUST NEVER block Ready.

**Rationale:** A backpack is not a database. The product exists to reason
under uncertainty, not to pretend inventory is permanently known.

### III. AI Proposes, Users Approve, Evidence Decides
The model MAY suggest which registered items an event may require. The user
MUST approve or reject each registered suggestion before it changes an
activity checklist. Only deterministic domain code MAY decide inventory
state, readiness, alert creation, alert resolution, or travel timing. Model
output MUST NEVER mutate sensor state. Unregistered suggestions MUST NEVER
affect readiness.

**Rationale:** Bounded AI is the submission thesis. Untrusted model output
must not become physical truth.

### IV. Deterministic Domain Independence
Pure domain functions MUST NOT call `Date.now()`, `Math.random()`, browser
APIs, React, or network APIs. Clock, ID generation, configuration, bag
state, and observation data MUST be injected. Alert IDs MUST be
deterministic from activity, item, condition, scan, and revision. There
MUST be at most one unresolved alert per activity and item.

**Rationale:** Core decision loops must be inspectable, testable, and
independent of UI or provider timing.

### V. Visible Simulation
Simulated RFID input MUST remain visibly labeled as simulated. The product
MUST NOT claim physical RFID validation, inside-versus-outside
classification as a solved hardware problem, live Maps data, or invented
leave-by times. A travel-provider failure MUST NOT invent a leave-by time
or alert evidence with a made-up estimate.

**Rationale:** Honest simulation is part of the product, not a disclaimer
to hide after polish.

### VI. Product Proof Before Explanation
The public site MUST show working missing-calculator behavior before
lengthy technical explanation. Hero states, landing proof, and the full
demo MUST use the same domain engine, the same activity requirements, and
the same alert state. Reset MUST restore one shared canonical demonstration
scenario.

**Rationale:** A polished surface that uses different logic than the demo
is the highest-risk false-completeness failure.

### VII. One Coherent Visual System
CarryOS MUST use one design language. Visual work MUST use only the two
approved 21st.dev references unless a material implementation blocker is
recorded. Do not assemble unrelated components from multiple visual
registries. Do not ship UI-lab, orbit-preview, particle, WebGL, Spline,
Three.js, canvas-particle, video-background, or orbiting-circle hero
experiments in the production build.

**Rationale:** Visual soup was a v1 failure mode. Consistency is a product
requirement, not decoration.

### VIII. No Fake Completeness
Do not ship fake Maps data presented as live, fake physical RFID claims,
fake testimonials, fake user counts, fake benchmarks, fake hardware
photography, static UI that does not use the real domain logic, or
placeholder integrations represented as completed features. Browser
notification permission MUST be requested only after an explicit user
action.

**Rationale:** Submission reviewers must be able to trust every claim.

### IX. Verification Before Completion
Every core acceptance criterion MUST have concrete evidence. When changing
a state transition or alert rule, focused tests MUST be updated before the
change is complete. Automated tests MUST NEVER require a live model call.
A core FAIL or core UNVERIFIED result blocks completion unless the only
missing evidence genuinely requires unavailable external credentials and
the local boundary is otherwise verified.

**Rationale:** Declarations of completeness are not evidence.

### X. Scope Discipline
Build the smallest complete product that satisfies the approved PRD. Do not
expand into a general-purpose AI assistant, smart-home platform, production
hardware product, location tracker, or multi-user SaaS application. Do not
add a database, authentication, persistence, real RFID, real Maps,
payments, or production deployment without separate authorization.

**Rationale:** Scope expansion destroys the submission's proof of a bounded
AI OS primitive.

## Security and Privacy Constraints

The carry-profile endpoint MUST accept POST JSON only, validate every
field, enforce request-size and text-length limits, apply a hard provider
timeout, apply bounded retry, apply best-effort throttling, and return a
safe error shape. Event text is untrusted content, not a system
instruction. The model has no tools and MUST NOT modify application state.

`OPENAI_API_KEY` and `OPENAI_MODEL` MUST remain server-only. No secret MAY
use a `NEXT_PUBLIC_` prefix. Credentials MUST NEVER appear in source,
tests, browser bundles, logs, screenshots, or documentation. The MVP MUST
NOT persist event text on the server. Raw unvalidated model output MUST
NEVER reach the client. Provider errors MUST NOT be exposed directly.

Accessibility basics MUST remain intact: semantic controls, readable
contrast, keyboard-reachable actions, reduced-motion support, and live
status text for async results.

## Architecture and Scope Boundaries

Required stack: Next.js App Router, React, TypeScript strict mode,
Tailwind CSS v4, selective shadcn/ui, Motion for React, Lucide React, Zod
or equivalent, Vitest, React Testing Library, Playwright, npm, and GitHub
Actions.

Domain modules own deterministic decisions. Application modules own
workflow coordination. React components render and dispatch actions. The
API route owns server validation and provider invocation. The model
provider does not own user approval. The sensor adapter does not own
inventory state. UI MUST NOT duplicate domain calculations.

Page files MUST remain thin. Domain logic MUST remain framework-independent.
The v1 monolithic `App.tsx` / `styles.css` structure, UI laboratory,
Orbiting Circles experiments, CarryBeliefOrbit, custom backpack SVG, and
ShadcnSpace Pro source MUST NOT be copied.

Eligible v1 reuse is limited to pure types, pure domain algorithms, test
scenarios, schema definitions, validation semantics, and fixture concepts,
and only after the new architecture and task plan exist.

## Governance

This constitution supersedes conflicting implementation convenience,
provider boilerplate, and specialist suggestions. The approved CarryOS v2
PRD and this constitution outrank Spec Kit artifacts, specialist output,
and framework defaults when they conflict.

Amendments MUST be written in `.specify/memory/constitution.md`, MUST bump
the version according to semantic versioning, MUST update the Sync Impact
Report, and MUST record `Last Amended` as an ISO date. MAJOR changes remove
or redefine a principle. MINOR changes add or materially expand guidance.
PATCH changes clarify wording without changing meaning.

Pull requests and completion reviews MUST verify: evidence-backed
readiness, deterministic domain tests, AI approval boundary, visible
simulation, shared domain engine across hero/landing/demo, no committed
secrets, and no unresolved Critical/High security findings.

Durable runtime guidance lives in root `AGENTS.md`. Temporary bootstrap
state MUST NOT override this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-08-17 | **Last Amended**: 2026-08-17
