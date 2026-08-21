# Feature Specification: CarryOS v2

**Feature Branch**: `001-carry-os-v2`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Approved CarryOS v2 PRD: greenfield rebuild of a software-first backpack intelligence layer that connects upcoming event context, approved item requirements, simulated inventory observations, uncertainty-aware memory, and departure timing into proactive evidence-backed warnings. Public landing page plus full technical demo. One bounded AI suggestion capability with user approval. No accounts, database, real RFID, or real maps."

## Clarifications

### Session 2026-08-17

- Q: What default public source URL should the secondary action use before a v2 remote exists? → A: Use the v1 public repository URL as the configured default, overridable by environment, and never invent a live deployment URL.
- Q: How should a throttled suggestion request be explained to the visitor? → A: Show a safe retryable message that suggestions are temporarily limited; do not expose provider or infrastructure details.
- Q: Which public proof is authoritative? → A: The landing reconciliation proof is derived from the shared Algorithms/Notebook domain scenario; the hero itself is a static product illustration.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand the product in ten seconds (Priority: P1)

A visitor opens the public site with no login and no model credentials. They see a direct headline, supporting product explanation, a source link, and an evidence-backed landing proof rather than a generic dashboard.

**Why this priority**: Reviewers must understand the product immediately. If this fails, later technical depth does not matter.

**Independent Test**: Open the public page and confirm the promise, source link, explanatory sections, and domain-derived proof are visible without setup.

**Acceptance Scenarios**:

1. **Given** a first-time visitor on the public page, **When** the page loads, **Then** they see “Know before you go,” the supporting product promise, and a source link.
2. **Given** the public page, **When** the visitor reads the product sections, **Then** the inventory relationship shown comes from the shared deterministic scenario.
3. **Given** the public page, **When** the visitor activates the source link, **Then** they open the configured public repository.

---

### User Story 2 - Present authentic Carry evidence on the landing page (Priority: P1)

The landing proof adapts the fixed Algorithms demonstration and its Notebook-missing reconciliation from the same decision engine used by the full demo. The hero remains a static product illustration.

**Why this priority**: The hero is the proof that Carry is a product, not a concept page.

**Independent Test**: Confirm the landing reconciliation rows and missing-item reason match the shared demonstration scenario.

**Acceptance Scenarios**:

1. **Given** the public page and canonical Algorithms demonstration, **When** the landing proof is built, **Then** Laptop, Charger, and Umbrella are matched and Notebook is missing.
2. **Given** reduced motion, **When** the public page loads, **Then** its content remains usable without motion-dependent meaning.

---

### User Story 3 - Complete the missing-Notebook proof (Priority: P1)

A visitor completes the core demonstration without setup: close the bag, see Notebook missing, inspect the warning, add Notebook, rescan, and see Ready for Algorithms. The landing proof and full demo use the same decision engine.

**Why this priority**: This is the primary product proof and the 60-second demo.

**Independent Test**: From a fresh load, complete scan → warning → add Notebook → rescan → Ready in under 60 seconds.

**Acceptance Scenarios**:

1. **Given** Algorithms with Laptop, Charger, and Umbrella in the bag and Notebook absent, **When** the visitor closes the bag and a valid scan completes, **Then** the present required items are Confirmed, Notebook is Not detected, readiness is Missing, and one unresolved Notebook warning exists.
2. **Given** that warning, **When** the visitor opens the explanation, **Then** they see activity, required item, latest scan time, inventory state, evidence level, leave-by time, and the next action.
3. **Given** an unresolved Notebook warning and an open bag, **When** the visitor adds Notebook, closes the bag, and a valid scan completes, **Then** Notebook is Confirmed, the warning is Resolved, readiness is Ready for Algorithms, and no second unresolved warning exists.
4. **Given** the public landing proof, **When** it renders the missing relationship, **Then** the result comes from the same decision engine as the full demo.

---

### User Story 4 - Operate the full technical demo (Priority: P1)

A reviewer uses the full demo workspace to inspect activity context, leave-by timing, inventory memory, sensor controls, alerts, AI suggestions, approval, notifications, developer trace, failure controls, and reset.

**Why this priority**: Technical reviewers must inspect the real loop, not only the landing proof.

**Independent Test**: Open the demo with no login and exercise activity, inventory, sensor, alert, AI, trace, and reset surfaces.

**Acceptance Scenarios**:

1. **Given** a visitor with no account, **When** they open the demo, **Then** they see current activity, start time, destination, leave-by, readiness, inventory memory, required and optional items, sensor controls, alert area, AI generator, trace, simulation disclosure, and reset.
2. **Given** the demo, **When** the visitor resets, **Then** the demonstration clock returns to its canonical 9:21 AM starting point, Algorithms requirements, initial bag contents, connected reader, empty alerts, cleared transient UI state, and deterministic reset trace are restored.
3. **Given** the demo, **When** the visitor inspects inventory, **Then** they can distinguish Confirmed, Probable, Not detected, Unknown, and Stale, and can tell inventory confidence apart from AI suggestion confidence.

---

### User Story 5 - Generate and approve an AI carry profile (Priority: P1)

A reviewer generates suggestions from the current fixed Algorithms event context and receives structured required, optional, excluded, and unregistered suggestions. Suggestions do not change readiness until the reviewer approves registered items. Rejected and unregistered suggestions never become requirements. The reachable workspace does not provide a free-form event editor.

**Why this priority**: This is the only model responsibility and the trust boundary of the product.

**Independent Test**: Generate from the current Algorithms context, confirm suggestions are visible but inactive, approve one item, reject another, and confirm only the approved registered item changes the checklist.

**Acceptance Scenarios**:

1. **Given** the registered catalog and current Algorithms context, **When** the visitor selects Generate profile, **Then** they see required, optional, excluded, and unregistered suggestions with confidence and a brief reason, and readiness is unchanged.
2. **Given** those suggestions, **When** the visitor approves a registered suggestion and rejects another, **Then** only the approved registered item updates the activity profile and the trace records request, source, validation, and approval decisions.
3. **Given** unregistered suggestions, **When** they appear, **Then** they cannot be applied as readiness-affecting requirements.

---

### User Story 6 - Keep working when the model is unavailable or invalid (Priority: P1)

If model credentials are missing, the provider fails, or output is malformed, the visitor still receives usable labeled fallback suggestions or a safe retryable error. The rest of the product remains functional. The interface never shows fake model success.

**Why this priority**: Preview and local use must not depend on secrets.

**Independent Test**: Generate the current activity profile without credentials and confirm labeled fallback plus a still-usable demo.

**Acceptance Scenarios**:

1. **Given** no model credentials, **When** the visitor generates the current activity profile, **Then** they receive deterministic fallback suggestions labeled as deterministic fallback, not as AI inference.
2. **Given** malformed or invalid model output, **When** validation fails after at most one repair retry, **Then** the visitor receives fallback or a clear non-technical error, and the trace records the failure without secrets or full prompts.
3. **Given** a temporarily limited suggestion request, **When** the service rejects it, **Then** the visitor sees a safe retryable message with no infrastructure details.

---

### User Story 7 - Fail safely on sensor, stale, and uncertain evidence (Priority: P1)

Reviewers can arm a failed scan, disconnect the reader, open the bag after a valid scan, and configure weak evidence. Ready never appears from failed, stale, or incomplete evidence. At most one unresolved warning exists per activity and item.

**Why this priority**: Uncertainty handling is the product thesis.

**Independent Test**: Exercise failed scan, bag-open stale path, weak evidence, and outside-bag test input; confirm Ready is withheld and explanations stay honest.

**Acceptance Scenarios**:

1. **Given** a connected reader, **When** the next scan is armed to fail and the bag is closed, **Then** inventory does not become Ready, readiness is Sensor unavailable or Scan required, and no new missing-item notification is created from that failed scan.
2. **Given** a valid closed-bag scan that confirmed required items, **When** the visitor opens the bag, **Then** previous evidence becomes Stale and Ready is withdrawn until a fresh closed-bag scan.
3. **Given** weak or intermittent evidence for a required item, **When** a valid scan completes, **Then** the item is Probable, readiness is Uncertain, and at most one uncertainty warning exists in the actionable window.
4. **Given** a tag marked outside the bag as simulated test input, **When** a scan completes, **Then** the item is not Confirmed and the UI labels the behavior as simulated test input.

---

### User Story 8 - Notify once, explain, and respect permission (Priority: P2)

Carry shows a mandatory in-app notification for a new unresolved missing-item condition. Browser notifications are optional and requested only after an explicit visitor action. Duplicate evaluations do not notify again. Acknowledgement, suppression, resolution, and expiration are inspectable.

**Why this priority**: Proactivity must be useful and not noisy.

**Independent Test**: Create one missing-item condition, confirm one in-app notification, duplicate-evaluate without a second notification, and confirm browser permission is requested only after opt-in.

**Acceptance Scenarios**:

1. **Given** a new unresolved missing-item condition inside the actionable window, **When** evaluation runs, **Then** one in-app notification is shown and opening it reveals the alert explanation.
2. **Given** that unresolved condition, **When** evaluation repeats with no material change, **Then** no additional notification is emitted.
3. **Given** the visitor has not opted in, **When** a warning occurs, **Then** no browser permission prompt appears and the in-app notification still works.
4. **Given** the visitor explicitly enables browser notifications and permission exists, **When** a new unresolved missing-item condition is created, **Then** one browser notification may also be emitted.

---

### Edge Cases

- A failed scan is recorded but does not create inventory truth, a missing-item warning, or Ready.
- A required item with no registered state cannot be ignored; readiness cannot become Ready.
- Missing-to-uncertain and uncertain-to-missing update the existing unresolved warning rather than creating a second one.
- Acknowledgement means the visitor has seen the warning; it remains unresolved and equivalent repeats do not notify again.
- Suppression stores an absolute 30-minute deadline. It blocks notifications until valid reevaluation at that deadline, a material condition change, confirmation, requirement removal, cancellation, or activity termination; history remains inspectable.
- An alert resolves when the item becomes Confirmed, the requirement is removed, or the activity is cancelled.
- An alert expires when the activity start time passes or the activity is completed.
- If timing data is unavailable, leave-by is not invented, timed proactive notification does not fire, and the interface explains that timing is unavailable.
- Opening the bag after evidence makes that evidence Stale.
- Outside-bag test hints prevent Confirmed and remain labeled as simulated.
- Invalid suggestion input is rejected before any model call.
- Unknown item identifiers in model output are not silently accepted.
- Duplicate item identifiers or an item in multiple suggestion categories are invalid.
- Refreshing the session restores the canonical demonstration unless the visitor is still in the in-memory session.
- Keyboard users can reach all controls; Escape closes dialogs and drawers; focus returns to the trigger; reduced motion preserves meaning.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The public page MUST communicate Carry’s promise and provide a source link without requiring login or model credentials.
- **FR-002**: The landing reconciliation proof MUST use the same deterministic scenario and decision logic as the full demo.
- **FR-003**: The public page MUST preserve equivalent meaning and usability under reduced motion.
- **FR-004**: The public page MUST include a simplified missing-Notebook proof derived from the shared decision engine.
- **FR-005**: The public page MUST follow the reachable section order: hero, How Carry works, Day changes, inventory proof, and closing product moment.
- **FR-006**: The full demo MUST expose activity context, timing, readiness, inventory memory, sensor controls, alerts, alert detail, AI generation, requirement approval, developer trace, simulation disclosure, and reset.
- **FR-007**: The product MUST include the registered item catalog and three activity profiles, with Algorithms as the default demonstration.
- **FR-008**: The demonstration clock MUST begin at 9:21 AM for a 10:00 AM Algorithms activity with 18 minutes travel and 7 minutes departure buffer, producing leave-by 9:35 AM. It MUST advance from an injected clock, reset to 9:21 AM, and remain labeled as a demonstration scenario.
- **FR-009**: The initial demonstration bag MUST contain Laptop, Charger, and Umbrella, with Notebook absent.
- **FR-010**: Visitors MUST be able to open the bag, close the bag and scan, add or remove items, set strong/weak/intermittent reads, mark outside-bag test input, arm a failed scan, disconnect or reconnect the reader, and reset the scenario.
- **FR-011**: Inventory evaluation MUST produce Confirmed, Probable, Not detected, Unknown, and Stale according to the evidence rules in the approved product specification.
- **FR-012**: Readiness MUST first return Not applicable for a canceled, completed, active, or already-started activity, then evaluate Sensor unavailable, Scan required, Missing, Uncertain, and Ready. Ready MUST require exactly one valid state for every registered required item, derived from the latest recent successful closed-bag scan and that scan's valid supporting observations. Optional items MUST NEVER block Ready.
- **FR-013**: Confirmed MUST reference the latest trustworthy successful closed-bag scan and its complete registered-item observation set, with no duplicate support, no outside test hint, sufficient consecutive reads, sufficient signal when provided, consistent confidence/reason/timestamps, and no bag opening after the scan.
- **FR-014**: A failed scan MUST be recorded and MUST NOT create new inventory truth, a missing-item warning, or Ready.
- **FR-015**: Leave-by MUST equal activity start minus travel duration minus departure buffer when timing is available, and MUST NOT be invented when timing is unavailable.
- **FR-016**: Carry MUST support missing-item and uncertain-item warnings with explicit active, acknowledged, suppressed, resolved, and expired transitions. Suppressed warnings MUST store an absolute 30-minute deadline and reevaluate when it is reached; canceled activities and removed requirements MUST resolve warnings; started or completed activities MUST expire them.
- **FR-017**: There MUST be at most one unresolved warning for the same activity and item. Missing/uncertain transitions and each new valid scan MUST update that warning's scan-aware evidence rather than create a second one; evidence-only refresh MUST NOT duplicate user notification.
- **FR-018**: Warning explanations MUST include activity, required item, latest scan time, inventory state, evidence level, leave-by time when available, and recommended next action.
- **FR-019**: In-app notification is mandatory for a newly active warning inside the actionable window. Browser notification is optional and MUST request permission only after an explicit visitor action. Only active warnings are actionable and countable; acknowledged warnings remain visible, while suppressed, resolved, and expired warnings are hidden.
- **FR-020**: Notifications MUST reconcile with warning status and evidence. Duplicate evaluations of an unchanged active condition MUST NOT emit duplicate notifications; reactivation after snooze or material evidence change MAY notify again.
- **FR-021**: A suggestion service MUST accept event context plus registered items, return required/optional/excluded/unregistered suggestions, and MUST NOT change readiness until a registered suggestion is explicitly approved.
- **FR-022**: Suggestion output MUST reject unknown identifiers, duplicates, multi-category items, out-of-range confidence, and more than eight total suggestions. Raw unvalidated output MUST NEVER reach the visitor.
- **FR-023**: If the model is unavailable, times out, is rate-limited, or returns invalid output after at most one repair retry, the visitor MUST receive labeled deterministic fallback or a safe retryable error.
- **FR-024**: Fallback MUST use event type, explicit registered-item name mentions, and simple approved rule profiles, and MUST be labeled as deterministic fallback rather than AI inference.
- **FR-025**: Unregistered suggestions MUST NEVER affect readiness.
- **FR-026**: The developer trace MUST record typed events for activity load, travel estimate, inference, validation, fallback, approval, rejection, bag/scan lifecycle, inventory recalculation, evidence corruption, alert lifecycle, notification, and reader connectivity, without secrets, full prompts, chain-of-thought, or sensitive headers.
- **FR-027**: Reset MUST restore the canonical demonstration: clock reset to the 9:21 AM starting point, Algorithms, default requirements, initial bag, connected reader, no scans, no alerts, cleared transient UI state, canceled obsolete inference work, and a deterministic reset trace.
- **FR-028**: Requirement changes through explicit suggestion approval and demonstration-profile reset MUST be available in the demo.
- **FR-029**: Inventory confidence and AI suggestion confidence MUST be visually and semantically separate.
- **FR-030**: Simulated inventory MUST be disclosed beside product proof. The product MUST NOT claim physical RFID validation or solved inside-versus-outside hardware classification.
- **FR-031**: All controls MUST be keyboard reachable, use visible focus, trap and restore focus in dialogs, expose live scan/alert status in text, and remain usable under reduced motion.
- **FR-032**: Loading, empty, error, and disabled states MUST exist for inference, scanning, travel estimate, initialization, no scans, no alerts, no suggestions, no trace, provider failure, scan failure, disconnected reader, denied notification permission, invalid input, and unknown required items.
- **FR-033**: The public page MUST remain usable at 1440, 768, 390, and 320 wide with no horizontal overflow and no clipped primary actions.
- **FR-034**: The product MUST NOT use WebGL, Spline, Three.js, canvas particle fields, video backgrounds, orbiting-circle heroes, fake testimonials, fake metrics, or remote product imagery required to understand the page.

### Key Entities

- **Item**: A registered object the backpack can remember, with display name, category, tag identity, and intended tag placement.
- **Activity**: An upcoming commitment with type, start time, destination, travel estimate, departure buffer, required items, optional items, and status.
- **Tag observation**: A simulated closed-bag reading of a tag, including time, optional signal, consecutive reads, and optional inside/outside test hint.
- **Inventory state**: Current belief for one item: confirmed, probable, not detected, unknown, or stale, with confidence, reason, explicit source-scan provenance, and supporting observations.
- **Alert**: An evidence-backed missing or uncertain warning for one activity-item pair, with status, version, and inspectable evidence.
- **Carry suggestion**: A model or fallback recommendation that an item is required, optional, or excluded, or an unregistered name that cannot affect readiness.
- **Trace event**: An inspectable record of a product decision or action, excluding secrets and raw prompts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can state what Carry does after no more than ten seconds on the public page.
- **SC-002**: A reviewer can complete the missing-Notebook flow from a fresh load in under 60 seconds and see Ready only after Notebook is added and freshly scanned.
- **SC-003**: After a valid missing-Notebook scan, exactly one unresolved Notebook warning exists; after a confirming rescan, that warning is resolved and no second unresolved Notebook warning exists.
- **SC-004**: Generating suggestions for the current Algorithms context without model credentials still returns usable labeled fallback suggestions, and the rest of the demo remains operable.
- **SC-005**: Approving or rejecting suggestions changes the activity checklist only for approved registered items; readiness does not change from unapproved model output.
- **SC-006**: A failed scan, opened bag after evidence, or required item without current confirmed evidence never produces Ready.
- **SC-007**: Keyboard-only visitors can complete demo, proof, alert inspection, and suggestion approval, and can dismiss dialogs with Escape.
- **SC-008**: At 1440, 768, 390, and 320 wide, primary actions remain visible and no page requires horizontal scrolling to read core content.
- **SC-009**: Simulation disclosure is visible beside the working proof without claiming physical inventory validation.
- **SC-010**: A reviewer can inspect why a warning fired, including activity, item, evidence, and next action, without reading source code.

## Assumptions

- The superseded Vite implementation is a behavioral reference only; this specification describes the authoritative Next.js v2 application in this repository.
- No login, accounts, database, or persistence layer is in scope. Client state is in-memory for the session and resets on refresh.
- Model credentials may be absent. Deterministic fallback is a required success path, not a degraded novelty.
- Browser notifications are browser-dependent residual risk; in-app notification remains the acceptance path.
- Distributed production rate limiting may remain a documented future operations requirement; a local per-instance limit is sufficient for this release.
- Physical RFID, NFC, Bluetooth tracking, live maps, calendar auth, native apps, payments, and production deployment are out of scope.
- The two approved visual references are Hero Section 9 and Flux Card Hero on 21st.dev. Direct code reuse is allowed only after license verification; otherwise the composition is independently reimplemented.
- Default source-link destination is the existing public CarryOS repository until a v2 remote is configured.
- Default timezone for demonstration copy is America/Chicago.
- Inventory confidence is a demonstration policy value, not a calibrated physical probability.
- A per-instance suggestion throttle that returns a safe retryable message is sufficient; the visitor is never shown provider error text.
