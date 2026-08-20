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
| State invariants | PASS | adversarial unit and Playwright-run boundary tests reject malformed/future evidence and duplicate required-item state |
| Alert lifecycle | PASS | unit and E2E coverage for acknowledge, snooze expiry, resolution, evidence refresh, notification reconciliation, and re-alert |
| Reset/accessibility | PASS | delayed-request reset and dialog focus-restoration E2E coverage |
| Spec Kit convergence | PASS | current scenario, reachable architecture, and acceptance documentation agree with the Algorithms/Notebook implementation |

Live model-provider call remains PASS WITH RESIDUAL RISK until credentials are available.
