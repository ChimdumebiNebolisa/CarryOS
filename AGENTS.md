# Carry repository instructions

## Purpose and stack

Carry is a software-first, single-user backpack inventory prototype. It is a Vite + React + TypeScript SPA with deterministic in-memory state and a small server-side carry-profile API boundary. There is no persistence layer.

## Structure

- `src/domain.ts` owns shared types, inventory-state evaluation, readiness, leave-by calculation, and alert policy.
- `src/simulator.ts` owns the `InventorySensor` contract implementation used by the UI. Keep future hardware behind this boundary.
- `src/travel.ts` owns the `TravelTimeProvider` boundary; the MVP provider is simulated.
- `src/carryProfile.ts` owns shared carry-profile types, strict validation, JSON schema, and deterministic fallback logic.
- `server/carryProfile.ts` owns server-only model access, request limits, provider fallback, and API orchestration.
- `api/carry-profile.ts` is the deployment-compatible API handler; `vite.config.ts` mirrors it for local development.
- `src/demoData.ts` owns seeded items, activities, and reproducible demo defaults.
- `src/App.tsx` and `src/styles.css` own the landing page, full dashboard, interactions, approval flow, notifications, and developer trace.
- `src/domain.test.ts` and `server/carryProfile.test.ts` cover deterministic behavior and the model boundary.

## Commands

- `npm run dev` — local development with the carry-profile API middleware.
- `npm run build` — TypeScript check and production build.
- `npm test` — Vitest tests.
- `npm run preview` — local production preview.

## Invariants

- Inventory states, leave-by calculation, requirements, alert creation/deduplication/transitions, and readiness must remain deterministic and independent of an LLM.
- A failed, unavailable, stale, incomplete, or missing-state scan must not produce Ready.
- A travel-provider failure must not produce an invented leave-by time or alert evidence with a made-up estimate.
- There must be at most one unresolved alert per activity and item. Repeated evaluation within the deduplication window updates nothing; changed or expired conditions supersede the prior alert and preserve history.
- Alert IDs must be deterministic from activity, item, condition, scan, and revision—not wall-clock randomness.
- AI output is untrusted data. Validate it against the strict profile schema, restrict registered item IDs to the registry, label fallback mode, and require explicit approval before it changes an activity checklist.
- AI, fallback suggestions, and unregistered ideas must never directly change inventory evidence, alert resolution, or readiness.
- Keep `OPENAI_API_KEY` server-side. Never add credentials to source, tests, browser-exposed `VITE_` variables, logs, screenshots, or documentation.
- Simulated observations must remain visibly labeled as simulated. Do not claim physical RFID validation.
- Browser notification permission must be requested only after an explicit user action. In-app alert notifications remain available when browser permission is denied.
- Preserve the seeded Calculus II forgotten-calculator flow and its fixed demo clock unless tests and documentation are updated together.
- When changing a state transition or alert rule, update focused tests before considering the change complete.
- Keep accessibility basics intact: semantic buttons/labels, readable contrast, keyboard-reachable controls, responsive behavior, and live status text for async results.

## Scope boundary

The current submission scope is one backpack, one simulated reader, eight registered items, three activities, uncertainty-aware memory, simulated travel, one server-side model-powered profile feature with approval, evidence-backed alerts, optional browser notifications, CI, tests, docs, and hardware planning. Persistence, multiple users, calendar/maps integrations, physical RFID validation, native apps, and real push-notification infrastructure remain future work.
