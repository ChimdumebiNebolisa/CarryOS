# Data Model: CarryOS v2

All domain types live in `src/domain/types.ts`. Pure functions consume injected clock/config/observations.

## Item

| Field | Type | Notes |
|-------|------|-------|
| id | string | Registry ID: laptop, charger, notebook, calculator, student-id, umbrella, headphones, keys, water-bottle |
| name | string | Display name |
| category | string | Tech, Study, Essentials, Personal |
| tagId | string | Simulated tag identity |
| tagPlacement | string | Intended placement copy |

## Activity

| Field | Type | Notes |
|-------|------|-------|
| id | string | algorithms, exam-lab, internship-shift |
| name | string | |
| type | class \| exam-lab \| internship | |
| startTime | ISO string | Demo Algorithms: 2026-08-05T10:00:00-05:00 |
| destination.name | string | |
| destination.description | string? | |
| travelMinutes | number? | Absent means timing unavailable |
| departureBufferMinutes | number | |
| requiredItemIds | string[] | |
| optionalItemIds | string[] | Must not overlap required |
| status | upcoming \| active \| completed \| cancelled | |

## TagObservation

| Field | Type | Notes |
|-------|------|-------|
| id | string | Deterministic from scan + tag |
| scanId | string | |
| itemId | string | Registered item identity; runtime validation requires it to match `tagId` |
| tagId | string | |
| detectedAt | ISO string | |
| signalStrength | number? | dBm-like demo value |
| consecutiveReads | number | |
| source | "simulated-rfid" | Only allowed source |
| bagState | "closed" | Valid observations are closed-bag |
| testLocationHint | inside \| outside \| unknown | Optional; outside blocks Confirmed |

## Scan

| Field | Type | Notes |
|-------|------|-------|
| id | string | Deterministic |
| startedAt / completedAt | ISO | |
| bagState | open \| closed | Valid inventory requires closed + completed |
| status | running \| completed \| failed | Failed creates no inventory truth |
| error | string? | Safe message |

## InventoryState

| Field | Type | Notes |
|-------|------|-------|
| itemId | string | |
| status | confirmed-present \| probably-present \| not-detected \| unknown \| stale | |
| confidence | 0–1 | Demonstration policy, not model confidence |
| reasonCode | string | |
| sourceScanId | string \| null | Latest trustworthy successful scan, or explicit null when no trustworthy scan exists |
| supportingObservationIds | string[] | |
| updatedAt | ISO | |

### Inventory transitions

- No valid closed completed scan → `unknown`
- Failed scan / disconnected reader → `unknown` (readiness: sensor-unavailable or scan-required)
- Valid scan, no matching observation → `not-detected`
- Valid scan, detected, weak/intermittent/inconsistent or hint not strong enough → `probably-present`
- Valid scan, strong closed-bag evidence, hint not outside → `confirmed-present`
- Bag opened after evidence, or stale threshold exceeded → `stale`

Confirmed and probable states reference the complete current observation set for their registered item and the latest trustworthy successful scan. Not-detected states reference that scan with an empty observation set. Unknown states may use explicit null provenance. Duplicate, missing, cross-scan, stale, or status/confidence-inconsistent provenance fails closed.

## Alert

| Field | Type | Notes |
|-------|------|-------|
| id | string | Deterministic from activity, item, condition, scan, revision |
| activityId / itemId | string | Uniqueness key for unresolved alerts |
| type | missing-item \| uncertain-item | |
| status | active \| acknowledged \| suppressed \| resolved \| expired | |
| stateVersion | number | Increments on type/evidence update |
| createdAt / updatedAt / resolvedAt | ISO | |
| evidence | AlertEvidence | activity, item, scan ID/time, inventory derivation time, observation IDs, state, confidence, leave-by, next action |

Unresolved = active | acknowledged | suppressed. At most one unresolved per activity+item. Missing↔uncertain updates that row.

## CarryProfileRequest / Result

See [contracts/carry-profile.md](./contracts/carry-profile.md). Client stores suggestions separately from activity requirements until approval.

## TraceEvent

Typed event name, ISO timestamp from injected clock, redacted payload. Forbidden: API keys, full prompts, CoT, sensitive headers, raw stack traces in UI.

## Demo session (application state, not persisted)

Canonical scenario from fixtures. Reset restores its 9:21 AM starting point; the injected runtime clock then advances. The landing reconciliation proof and demo share the scenario/domain engine. The hero is a static product illustration.

## Validation rules

- Required and optional item ID sets are disjoint and subset of registry
- All temporal domain inputs use strict RFC 3339 datetimes with an explicit timezone
- A malformed latest evidence record fails closed; later valid evidence may establish a new boundary while corruption remains traceable
- Confidence 0–1
- Suggestion output max 8 total suggestions
- Duplicate suggestion IDs invalid
- Item cannot appear in multiple suggestion categories; required wins only after server normalization if repair retry is used, otherwise invalid
- Unknown IDs never accepted into registered arrays
