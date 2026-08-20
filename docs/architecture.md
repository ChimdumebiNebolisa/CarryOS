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

Domain modules own deterministic decisions and reject malformed temporal or inventory evidence. Application modules coordinate the demo session and alert lifecycle. React components render and dispatch. `POST /api/carry-profile` bounds and validates input, optionally calls the model provider, normalizes output, and never changes readiness.

The landing reconciliation proof and `/demo` call `src/application/demo-scenario.ts` and `src/domain/*`. The reachable hero is a static product illustration; `src/application/hero-states.ts` and `CarryStateStack.tsx` are retained test fixtures, not reachable product surfaces.

The canonical demonstration is Algorithms at 10:00 AM, with a fixed 9:21 AM clock, a 9:35 AM leave-by time, and Notebook initially absent. Alert statuses have explicit visibility, countability, actionability, and transition semantics in `src/domain/alerts.ts`.
