# Carry repository instructions

## Purpose and stack

Carry is a software-first, single-user backpack inventory prototype. It is a Vite + React + TypeScript SPA with deterministic in-memory state; there is no backend or persistence layer.

## Structure

- `src/domain.ts` owns shared types, inventory-state evaluation, readiness, leave-by calculation, and alert policy.
- `src/simulator.ts` owns the `InventorySensor` contract implementation used by the UI. Keep future hardware behind this boundary.
- `src/travel.ts` owns the travel provider boundary; the MVP provider is simulated.
- `src/demoData.ts` owns seeded items, activities, and reproducible demo defaults.
- `src/App.tsx` and `src/styles.css` own the dashboard and interaction shell.
- `src/domain.test.ts` covers deterministic domain and simulator behavior.

## Commands

- `npm run dev` — local development.
- `npm run build` — TypeScript check and production build.
- `npm test` — Vitest tests.
- `npm run preview` — local production preview.

## Invariants

- Keep inventory states, leave-by calculation, requirements, alert creation/deduplication/resolution, and scan validity deterministic; do not make them dependent on an LLM.
- A failed or unavailable scan must not produce Ready; use Unknown or Sensor unavailable instead.
- Simulated observations must remain visibly labeled as simulated. Do not claim physical RFID validation.
- Do not add secrets, real credentials, private endpoints, calendar access, maps access, or production push-notification configuration.
- Preserve the seeded Calculus II forgotten-calculator flow and its fixed demo clock unless tests and documentation are updated together.
- When changing a state transition or alert rule, update focused tests in `src/domain.test.ts` before considering the change complete.
- Keep accessibility basics intact: semantic buttons/labels, readable contrast, keyboard-reachable controls, and responsive behavior.

## Scope boundary

The current submission scope is one backpack, one simulated reader, eight registered items, three activities, uncertainty-aware memory, simulated travel, evidence-backed alerts, resolution, tests, and hardware planning. Persistence, multiple users, calendar/maps integrations, AI, native apps, and hardware validation are future work.
