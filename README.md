# Carry

Carry is a context-aware backpack assistant. It connects a next commitment to a user-approved carry profile, simulated RFID inventory evidence, a provider-backed leave-by estimate, and one explainable action when an important item is missing.

## What is real in this prototype

- Deterministic inventory states: confirmed, probable, not detected, unknown, and stale.
- Deterministic readiness and alert policy. Failed, missing, stale, or incomplete evidence cannot become Ready.
- A hardware-neutral `InventorySensor` interface with a functional simulated RFID reader.
- A `TravelTimeProvider` boundary with a simulated implementation. Provider failure never invents a leave-by time.
- One model-powered feature: server-side carry-profile generation through the OpenAI Responses API using strict JSON schema output and application-side validation.
- Explicit approval before an AI or fallback profile changes the selected activity checklist.
- In-app notifications by default; optional browser notifications only after a user click.

The fixed demo clock is August 5, 2026 at 8:21 AM. Refreshing the SPA resets the in-memory scenario.

## Run locally

```bash
npm ci
npm run dev
```

Open the Vite URL shown in the terminal. The Vite development server also exposes `POST /api/carry-profile` through middleware.

To enable the real model provider, copy `.env.example` to `.env.local` and configure the server-only variables:

```bash
OPENAI_API_KEY=your-server-side-key
OPENAI_MODEL=gpt-5.6
OPENAI_BASE_URL=https://api.openai.com/v1/responses
```

Never prefix these variables with `VITE_`; the browser must not receive the key. Without a configured provider, Carry returns a labeled deterministic fallback and remains fully usable.

## Commands

```bash
npm test          # deterministic domain, server boundary, and fallback tests
npm run build     # TypeScript check and production Vite build
npm run preview   # serve the production frontend locally
npm run dev       # Vite app plus local carry-profile API middleware
```

CI runs `npm ci`, `npm test`, and `npm run build` on pushes and pull requests.

## Demo routes

- `/` — public product landing page, interactive real-engine demo, model boundary, and honest hardware/provider disclosure.
- `/demo` — full simulator dashboard with activity switching, inventory evidence, alert explanation, sensor lab, requirements editor, browser-notification opt-in, and developer trace.

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for a concise walkthrough.

## Architecture

```text
Activity context + approved profile
              ↓
TravelTimeProvider ────────┐
                           ↓
SimulatedRFIDReader → Scan + TagObservation
                           ↓
                   deterministic state engine
                           ↓
                 readiness + evidence alerts
                           ↓
             landing page / full dashboard / trace

AI profile form → server /api/carry-profile → strict schema validation
                              ↓
                   AI draft or deterministic fallback
                              ↓
                       explicit user approval
```

The model can propose registered items and unregistered ideas. It cannot mark an item present, resolve an alert, or produce readiness. Only the deterministic engine consumes fresh closed-bag scan evidence.

## Project map

- `src/domain.ts` — shared types, inventory state, readiness, timing, and alert policy.
- `src/simulator.ts` — simulated RFID reader and future M5Stack adapter boundary.
- `src/travel.ts` — simulated travel provider and future maps-provider boundary.
- `src/carryProfile.ts` — shared carry-profile types, strict validation, schema, and deterministic fallback.
- `server/carryProfile.ts` — server-only OpenAI Responses provider and API orchestration.
- `api/carry-profile.ts` — deployment-compatible API handler.
- `src/demoData.ts` — eight registered items, three activity profiles, and deterministic defaults.
- `src/App.tsx` / `src/styles.css` — landing page, demo dashboard, simulator controls, AI approval UI, drawers, and trace.
- `src/domain.test.ts` — state, timing, alert, stale, failure, deduplication, transition, and provider-boundary tests.
- `server/carryProfile.test.ts` — structured-output, schema, approval, and fallback tests.
- `hardware-plan.md` — future physical integration and calibration experiments.

## Honest boundaries

This repository does not claim physical RFID validation, maps or calendar access, persistence, multiple users, native push delivery, or a production hardware enclosure. The M5Stack and maps adapters remain future boundaries. The UI labels simulated data and uncertainty wherever it matters.

## License

MIT. See [LICENSE](./LICENSE).
