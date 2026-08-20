# Tasks: CarryOS v2

> Historical generation checklist. It is not current execution status or acceptance evidence. The reachable v2 product uses the Algorithms/Notebook scenario documented in `README.md`, `docs/architecture.md`, and `docs/acceptance-matrix.md`.

**Input**: Design documents from `/specs/001-carry-os-v2/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the PRD (unit, API, component, integration, e2e). Write failing tests before implementation where the story is domain/API-critical.

**Organization**: Tasks are grouped by user story. Specialist hooks are noted in orchestration state, not as a competing plan.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label
- Include exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Next.js App Router project, tooling, ignore rules, env example

- [ ] T001 Create Next.js App Router TypeScript project with Tailwind CSS v4 in repository root without overwriting `AGENTS.md`
- [ ] T002 Add Motion, Lucide, Zod, Vitest, RTL, Playwright, and shadcn primitive dependencies in `package.json`
- [ ] T003 [P] Add npm scripts `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e` in `package.json`
- [ ] T004 [P] Create `.gitignore`, `.env.example`, `LICENSE` (MIT), and GitHub Actions workflow in `.github/workflows/ci.yml`
- [ ] T005 [P] Create `docs/v1-behavior-map.md` mapping accepted v1 behaviors to v2 locations

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared domain engine, fixtures, adapters, session coordinator. Blocks all UI stories.

**⚠️ CRITICAL**: No user story UI until this phase is complete

- [ ] T006 [P] Define domain types in `src/domain/types.ts`
- [ ] T007 [P] Implement injected clock and deterministic IDs in `src/lib/clock.ts` and `src/lib/ids.ts`
- [ ] T008 [P] Add fixtures for eight items and three activities in `src/fixtures/items.ts` and `src/fixtures/activities.ts`
- [ ] T009 Write unit tests for timing, inventory, readiness, and alerts in `tests/unit/domain.test.ts`
- [ ] T010 Implement leave-by calculation in `src/domain/timing.ts`
- [ ] T011 Implement inventory evaluation in `src/domain/inventory.ts`
- [ ] T012 Implement readiness precedence in `src/domain/readiness.ts`
- [ ] T013 Implement alert uniqueness, missing↔uncertain update, ack/suppress/resolve/expire in `src/domain/alerts.ts`
- [ ] T014 Implement carry-profile schema, normalization, and fallback in `src/domain/carry-profile.ts`
- [ ] T015 [P] Implement simulated RFID adapter in `src/adapters/inventory/simulated-rfid.ts`
- [ ] T016 [P] Implement simulated travel adapter in `src/adapters/travel/simulated-travel.ts`
- [ ] T017 Implement demo scenario coordinator and reset in `src/application/demo-scenario.ts` and `src/fixtures/demo-scenario.ts`
- [ ] T018 [P] Implement notification policy in `src/application/notification-policy.ts`
- [ ] T019 [P] Implement developer trace in `src/application/trace.ts`
- [ ] T020 Write integration tests for sensor→inventory→readiness→alert→notification in `tests/integration/decision-loop.test.ts`

**Checkpoint**: Domain engine can complete missing-calculator and failure paths without UI

---

## Phase 3: User Story 1 - Understand the product (Priority: P1) 🎯 MVP visual shell

**Goal**: Public `/` communicates promise, CTA, source link, disclosure

**Independent Test**: Open `/` and see headline, CTA to `/demo`, source link, simulation disclosure

**Specialist hook**: `UI-DIRECTION` then `STYLESEED` on the hero (Phase 4 continues the hero)

- [ ] T021 [US1] Create root layout, fonts, and tokens in `src/app/layout.tsx` and `src/app/globals.css`
- [ ] T022 [US1] Implement marketing page shell and section order in `src/app/page.tsx`
- [ ] T023 [US1] Implement nav, headline, CTA, source link, and disclosure in `src/components/marketing/Hero.tsx`

**Checkpoint**: Page communicates Carry in ten seconds even before state stack polish

---

## Phase 4: User Story 2 - Hero state preview (Priority: P1)

**Goal**: Authentic state stack from domain engine; reduced motion; pause offscreen

**Independent Test**: Manual state nav shows awaiting/scanning/missing/ready from shared engine

**Specialist hook**: `UI-DIRECTION` (frontend-design) then StyleSeed setup/resolve/score gate

- [ ] T024 [US2] Compute hero states from shared demo scenario in `src/application/demo-scenario.ts`
- [ ] T025 [US2] Implement Carry state stack in `src/components/marketing/CarryStateStack.tsx`
- [ ] T026 [US2] Add autoplay-once, pause hidden/offscreen, reduced-motion Missing in `src/components/marketing/CarryStateStack.tsx`
- [ ] T027 [US2] Component tests for hero states and reduced motion in `tests/unit/hero-state-stack.test.tsx`

**Checkpoint**: Hero uses domain output; StyleSeed representative gate required before remaining landing sections

---

## Phase 5: User Story 3 - Missing-calculator proof (Priority: P1)

**Goal**: Landing proof and `/demo` complete calculator flow with shared engine

**Independent Test**: Scan → missing alert → add calculator → Ready

- [ ] T028 [US3] Implement working proof using shared engine in `src/components/marketing/WorkingProof.tsx`
- [ ] T029 [US3] Implement demo workspace shell in `src/app/demo/page.tsx` and `src/components/demo/DemoWorkspace.tsx`
- [ ] T030 [US3] Implement activity, inventory, sensor, alert panel/detail in `src/components/demo/ActivityContext.tsx`, `InventoryMemory.tsx`, `SensorLab.tsx`, `AlertPanel.tsx`, `AlertDetail.tsx`
- [ ] T031 [US3] E2E missing-calculator flow in `tests/e2e/missing-calculator.spec.ts`

**Checkpoint**: Core 60-second demo works

---

## Phase 6: User Story 4 - Full technical demo (Priority: P1)

**Goal**: Remaining demo surfaces: requirements editor, trace, reset, disclosures

**Independent Test**: Reset restores canonical scenario; all listed demo panels exist

- [ ] T032 [US4] Implement reset and remaining demo panels in `src/components/demo/DemoWorkspace.tsx`
- [ ] T033 [US4] Implement developer trace UI in `src/components/demo/DeveloperTrace.tsx`
- [ ] T034 [US4] Component tests for reset and sensor controls in `tests/unit/demo-workspace.test.tsx`

---

## Phase 7: User Story 5 - AI carry-profile generation (Priority: P1)

**Goal**: Server endpoint + approval UI; suggestions do not change readiness until approved

**Independent Test**: Submit exam context, approve calculator, reject laptop

**Specialist hook**: `SECURITY` before route implementation

- [ ] T035 [P] [US5] API tests with fake provider in `tests/integration/carry-profile-api.test.ts`
- [ ] T036 [US5] Implement env, provider interface, OpenAI provider, fallback in `src/lib/env.ts`, `src/adapters/ai/`
- [ ] T037 [US5] Implement rate limiter in `src/adapters/rate-limit/rate-limiter.ts`
- [ ] T038 [US5] Implement POST `/api/carry-profile` in `src/app/api/carry-profile/route.ts`
- [ ] T039 [US5] Implement generator and approval UI in `src/components/demo/CarryProfileGenerator.tsx` and `RequirementApproval.tsx`
- [ ] T040 [US5] E2E AI approval in `tests/e2e/ai-approval.spec.ts`

---

## Phase 8: User Story 6 - Missing credentials and invalid output (Priority: P1)

**Goal**: Fallback labeling and safe errors

**Independent Test**: Production-mode without key returns fallback

- [ ] T041 [US6] Cover missing key, timeout, malformed output, 429 in `tests/integration/carry-profile-api.test.ts`
- [ ] T042 [US6] E2E no-model-key in `tests/e2e/no-model-key.spec.ts`

---

## Phase 9: User Story 7 - Sensor, stale, uncertain (Priority: P1)

**Goal**: Failure controls and honest non-Ready states

**Independent Test**: Failed scan and stale bag-open withhold Ready

- [ ] T043 [US7] Unit tests for failed scan, stale, probable, outside hint in `tests/unit/domain.test.ts`
- [ ] T044 [US7] E2E sensor failure and stale evidence in `tests/e2e/sensor-failure.spec.ts` and `tests/e2e/stale-evidence.spec.ts`

---

## Phase 10: User Story 8 - Notifications (Priority: P2)

**Goal**: In-app mandatory; browser optional after click

**Independent Test**: One in-app notification; no permission prompt without opt-in

- [ ] T045 [US8] Implement in-app notifications and permission-gated browser notify in `src/application/notification-policy.ts` and demo UI
- [ ] T046 [US8] Component tests for notification and alert drawer focus in `tests/unit/alert-notifications.test.tsx`

---

## Phase 11: Remaining landing sections and polish

**Purpose**: Belief, AI boundary, architecture, limitations, final CTA, docs, CI evidence

- [ ] T047 [P] Implement remaining marketing sections in `src/components/marketing/BeliefSection.tsx`, `AiBoundary.tsx`, `ArchitectureSection.tsx`, `LimitationsSection.tsx`, `FinalCta.tsx`
- [ ] T048 [P] Write `docs/architecture.md`, `docs/hardware-plan.md`, `docs/demo-script.md`, `docs/acceptance-matrix.md`, and `README.md`
- [ ] T049 Add security headers via Next config in `next.config.ts`
- [ ] T050 Playwright overflow checks at 1440/768/390/320 in `tests/e2e/responsive.spec.ts`
- [ ] T051 Durable `AGENTS.md` update without weakening invariants

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 (blocks all stories)
- US1/US2 hero gate before remaining landing polish (T047)
- US3 depends on Phase 2
- US5 SECURITY hook before T036–T038
- US6 depends on US5
- Polish after core stories

### Specialist hooks (orchestration)

| Tasks | Hook |
|-------|------|
| T023–T027 | UI-DIRECTION + STYLESEED |
| T036–T038 | SECURITY |
| T047 | STYLESEED |
| Final review | Vibe Security audit + Code Review Expert |

## Parallel Example: Foundational domain

```text
T006 types.ts
T007 clock/ids
T008 fixtures
then T009 tests then T010–T014 domain
```

## Implementation Strategy

1. Setup + domain engine with tests
2. Hero as real product UI + StyleSeed gate
3. Demo missing-calculator E2E
4. AI endpoint under security constraints
5. Failure paths, notifications, remaining landing, docs

---

## Phase 12: Convergence (2026-08-17)

Core stories T001–T051 are implemented in CarryOS-next. Remaining items are residual verification.

- [x] T052 [P] Playwright overflow check at 1440/768/390/320 in `tests/e2e/responsive.spec.ts`
- [x] T053 [US8] Browser notification permission requested only after an explicit control in `src/components/demo/DemoWorkspace.tsx`
- [x] T054 Run StyleSeed canonical `styleseed-check.mjs` after capturing registry artifacts for the two 21st.dev references
- [x] T055 Live OpenAI Responses call with real credentials (local provider/fallback boundary already tested; PASS WITH RESIDUAL RISK)
