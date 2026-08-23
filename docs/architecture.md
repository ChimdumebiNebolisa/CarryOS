# Architecture

```text
Event context
→ profile suggestion
→ user approval
→ activity requirements
→ simulated observation
→ inventory belief
→ readiness
→ intervention
```

Domain modules own deterministic decisions and enforce a provenance chain from the latest trustworthy successful closed-bag scan, through registered observations, to derived inventory state and readiness. Strict RFC 3339 timestamps are required. A malformed latest record fails closed; malformed history is retained as corruption evidence but a later internally consistent scan starts a new trustworthy derivation boundary. Application modules coordinate the demo session and alert lifecycle. React components render and dispatch. `POST /api/carry-profile` bounds and validates input, optionally calls the model provider, normalizes output, and never changes readiness.

`/` is a static editorial poster (split paper type column + stored commute photograph). `/how-it-works` renders an interactive React Flow system graph: five subsystem groups (context, requirements, observation, state, decision), trust-boundary styling (dashed terracotta = model-assisted, sand = user gate, hairline = deterministic, dotted green = simulated input), node selection with a side explanation panel, and a simulation disclosure. `/demo` and the landing-proof helpers still call `src/application/demo-scenario.ts` and `src/domain/*`. `src/application/hero-states.ts` remains a test fixture, not a reachable product surface.

The canonical demonstration is Algorithms at 10:00 AM, beginning at 9:21 AM with a 9:35 AM leave-by time and Notebook initially absent. Its injected runtime clock advances after initialization and reset returns it to 9:21 AM. Alert evaluation processes removed requirements and terminal activities before evidence validation, confirmation, snooze expiry, evidence refresh, reactivation, or creation. Alert evidence stores scan identity, scan time, inventory derivation time, and supporting observation IDs. Browser notifications are emitted from one session-transition effect, including alerts created by approved requirement changes.

The AI generator uses the current Algorithms activity context assembled by the demo. The server contract accepts event context, but the reachable workspace does not expose a free-form event editor.
