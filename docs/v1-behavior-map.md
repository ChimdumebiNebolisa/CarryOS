# V1 behavior map

Read-only reference: existing CarryOS on `feat/era-submission-polish`.

| V1 behavior | V2 requirement | Location | Verification | Reuse |
|-------------|----------------|----------|--------------|-------|
| Inventory states | D-01, FR-011 | `src/domain/inventory.ts` | `tests/unit/domain.test.ts` | Reimplemented |
| Readiness precedence | FR-012 | `src/domain/readiness.ts` | unit tests | Reimplemented |
| Leave-by math | FR-015 | `src/domain/timing.ts` | unit tests | Reimplemented algorithm |
| Alert uniqueness | D-05 | `src/domain/alerts.ts` | unit tests | Reimplemented; v1 expire-and-recreate replaced by in-place update |
| Fallback profile | AI-05 | `src/domain/carry-profile.ts` | API tests | Reimplemented semantics |
| Simulated RFID | FR-005 | `src/adapters/inventory/simulated-rfid.ts` | integration | Reimplemented |
| Carry-profile API | AI-01 | `src/app/api/carry-profile/route.ts` | API tests | Reimplemented contract |
| Demo fixtures | FR-007 | `src/fixtures/*` | unit | Concepts ported; IDs follow PRD (`charger`, `exam-lab`) |
| Landing/hero/demo UI | P-01–P-10 | `src/components/*` | e2e | Rebuilt |
| Monolithic App.tsx / styles / orbit experiments | non-goals | not present | inspection | Not reused |
