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

Domain modules own deterministic decisions. Application modules coordinate the demo session. React components render and dispatch. `POST /api/carry-profile` validates input, optionally calls the model provider, normalizes output, and never changes readiness.

Hero states, the landing working proof, and `/demo` all call `src/application/demo-scenario.ts` and `src/domain/*`.
