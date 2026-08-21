# Acceptance matrix

See the PRD IDs. Bootstrap verification:

| ID | Result | Evidence |
|----|--------|----------|
| P-01 | PASS | Landing headline and copy |
| P-02 | PASS | E2E CTA |
| P-07 | PASS | E2E missing notebook |
| P-08 | PASS | E2E rescan Ready for Algorithms |
| D-01 | PASS | Unit tests |
| D-02 | PASS | Unit + e2e stale |
| D-03 | PASS | Unit + e2e failed scan |
| AI-01 | PASS | Route Handler + API tests |
| AI-05 | PASS | Fallback API test |
| O-04 | PASS | `npm test` |
| O-09 | PASS | `AGENTS.md` |

## Final bootstrap gates

| ID | Result | Evidence |
|----|--------|----------|
| T054 | PASS | `.styleseed/evidence/site-home/t054/deterministic.json` and `.styleseed/evidence/demo-workspace/t054/deterministic.json` show no findings; rendered style check snapshots exist in CarryOS-next output |
| T055 | PASS WITH RESIDUAL RISK | real API credentials not provided; fallback behavior validated in API tests |
| State invariants | PASS | adversarial domain tests cover strict timestamps, current-scan provenance, supporting observations, confidence/status consistency, duplicate evidence, corrupt-latest failure, and historical recovery |
| Alert lifecycle | PASS | domain and production-browser tests cover acknowledge, absolute snooze expiry, combined terminal transitions, resolution, scan-aware refresh, simultaneous alerts, notification reconciliation, and re-alert |
| Reset/accessibility | PASS | production-browser tests cover reset cancellation, superseded requests, dialog description, focus trap/restoration, and fallback focus when the underlying alert disappears |
| Spec Kit convergence | PASS | specification, data model, quickstart, architecture, and reachable Algorithms/Notebook behavior use the same scenario and capability boundaries |

Live model-provider call remains PASS WITH RESIDUAL RISK until credentials are available.
