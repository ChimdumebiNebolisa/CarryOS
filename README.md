# Carry

Carry is a context-aware backpack inventory assistant. It connects a simulated RFID inventory to the user’s next commitment, a deterministic leave-by calculation, and an evidence-backed warning when something important is missing.

## Prototype disclosure

Carry currently implements the complete inventory-memory, activity-context, leave-time, alert, and explanation pipeline. RFID observations are simulated through a hardware-compatible sensor interface. Physical reader reliability, antenna placement, and inside-versus-outside tag detection have not yet been validated. The planned next step is integrating an M5Stack UHF RFID reader and calibrating the system using a real backpack.

This version is intentionally a single-user, single-backpack, in-memory software prototype. Refreshing the page resets the demo scenario. There is no calendar authentication, maps integration, push notification service, AI dependency, or physical sensor connection.

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. The reproducible demo clock is 8:21 AM on August 5, 2026.

## Primary demo: forgotten calculator

1. Start on the Calculus II activity.
2. In **Sensor lab**, click **Close bag & scan**. Laptop, notebook, and Student ID are detected; the calculator is absent.
3. Open the **Missing item** explanation to inspect the activity, leave-by time, scan ID, state, and next action.
4. Click **Open bag**, switch Calculator to **In bag**, then click **Close bag & scan**.
5. Carry resolves the alert and shows **Ready for Calculus II**.

The simulator also exposes weak, intermittent, and outside-bag readings, failed scans, reader disconnect/reconnect, requirement editing, and a developer trace.

## Commands

```bash
npm run dev       # local development server
npm run build     # TypeScript check and production build
npm test          # deterministic domain and simulator tests
npm run preview   # serve the production build locally
```

## Architecture

```text
SimulatedRFIDReader
        ↓ InventorySensor contract
TagObservation + Scan history
        ↓
Inventory-state engine
        ↓
Activity requirement engine + simulated travel provider
        ↓
Alert policy + evidence builder
        ↓
React dashboard, explanation drawer, and developer trace
```

Deterministic responsibilities stay in the domain engine: confidence thresholds, inventory state transitions, leave-by calculation, required-item matching, alert deduplication, and alert resolution. An AI service is not required for the MVP.

## Project map

- `src/domain.ts` — types, state engine, readiness, timing, and alert policy.
- `src/simulator.ts` — functional simulated RFID reader plus the unvalidated M5Stack adapter boundary.
- `src/travel.ts` — simulated travel provider and future maps-provider boundary.
- `src/demoData.ts` — eight registered items and three deterministic activity profiles.
- `src/App.tsx` / `src/styles.css` — interactive dashboard, simulator controls, detail drawers, and developer trace.
- `src/domain.test.ts` — state, timing, alert, failure, deduplication, resolution, and interface coverage.
- `hardware-plan.md` — planned physical integration and calibration experiments.

## Submission status

Implemented locally: the software vertical slice, automated core tests, hardware adapter boundary, and disclosure documentation.

Not evidenced by this repository-only bootstrap: a public deployment and a recorded demo video. Those require an external hosting account and a human-recorded walkthrough after the local flow is accepted.
