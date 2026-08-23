export type SubsystemKind = 'deterministic' | 'model' | 'human' | 'simulated'
export type SubsystemGroupId = 'context' | 'requirements' | 'observation' | 'state' | 'decision'

export interface SubsystemGroup {
  id: SubsystemGroupId
  label: string
}

export interface Subsystem {
  id: string
  groupId: SubsystemGroupId
  kind: SubsystemKind
  tag: string
  title: string
  sub?: string
  body: string
  facts: readonly string[]
}

export const subsystemGroups: readonly SubsystemGroup[] = [
  { id: 'context', label: 'Context' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'observation', label: 'Observation' },
  { id: 'state', label: 'State' },
  { id: 'decision', label: 'Decision' },
]

export const subsystems: readonly Subsystem[] = [
  {
    id: 'event-context',
    groupId: 'context',
    kind: 'deterministic',
    tag: 'Input',
    title: 'Event Context',
    sub: 'Algorithms · 10:00 AM · leave by 9:35 AM',
    body: 'The upcoming activity, its schedule, and its destination. Context is the only reason a required item exists.',
    facts: [
      'Canonical scenario: Algorithms at 10:00 AM, system time 9:21 AM, leave-by 9:35 AM.',
      'The activity record carries required and optional item IDs plus travel and buffer minutes.',
      'Leave-by is derived deterministically in src/domain/timing.ts.',
    ],
  },
  {
    id: 'suggestion',
    groupId: 'requirements',
    kind: 'model',
    tag: 'Model · Untrusted',
    title: 'Requirement Suggestion',
    sub: 'Bounded AI layer',
    body: 'A bounded model proposes which registered items the current event may require. A deterministic fallback takes over when no model key is configured.',
    facts: [
      'POST /api/carry-profile bounds, validates, and rate-limits every request.',
      'Model output is normalized and schema-checked before it reaches the UI.',
      'Suggestions never touch sensor state, inventory, or readiness.',
    ],
  },
  {
    id: 'approval',
    groupId: 'requirements',
    kind: 'human',
    tag: 'User gate',
    title: 'User Approval',
    body: 'Nothing inferred becomes a requirement until the user accepts it. This is the explicit trust boundary between the model and the checklist.',
    facts: [
      'Approved and rejected suggestions are recorded in the decision trace.',
      'Rejected items can never enter the activity requirements.',
      'The model cannot mutate requirements on its own.',
    ],
  },
  {
    id: 'requirements',
    groupId: 'requirements',
    kind: 'deterministic',
    tag: 'Deterministic',
    title: 'Activity Requirements',
    body: 'The authoritative set of items CarryOS expects the user to have for the activity. Readiness is computed against this set and nothing else.',
    facts: [
      'Only user-approved item IDs become requirements.',
      'Removing a requirement reevaluates existing alerts.',
      'Optional items are tracked but never gate readiness.',
    ],
  },
  {
    id: 'registered-items',
    groupId: 'observation',
    kind: 'deterministic',
    tag: 'Registry',
    title: 'Registered Items',
    body: 'The universe of items CarryOS knows about, each bound to an RFID tag identity. Only registered items participate in observation logic.',
    facts: [
      'Every item carries a tag ID and tag placement.',
      'Unregistered suggestions are reported separately and never auto-added.',
      'Observations for unknown tags cannot influence inventory state.',
    ],
  },
  {
    id: 'observation',
    groupId: 'observation',
    kind: 'simulated',
    tag: 'Simulated RFID',
    title: 'Observation Layer',
    sub: 'Closed-bag reads · simulated',
    body: 'Closed-bag tag reads produce observations. This layer is explicitly simulated; no physical reader hardware is validated.',
    facts: [
      'Every read is stamped source: simulated-rfid.',
      'Only completed scans of a closed bag count as evidence.',
      'Physical reader work is scoped in docs/hardware-plan.md.',
    ],
  },
  {
    id: 'evidence',
    groupId: 'observation',
    kind: 'deterministic',
    tag: 'Provenance',
    title: 'Evidence / Provenance',
    body: 'Each derived state keeps a provenance chain back to the scan identity and the supporting observation IDs that produced it.',
    facts: [
      'Alert evidence stores scan ID, scan time, derivation time, and observation IDs.',
      'A malformed latest record fails closed.',
      'Corrupt history is retained as evidence; a later consistent scan starts a new boundary.',
    ],
  },
  {
    id: 'reconciliation',
    groupId: 'state',
    kind: 'deterministic',
    tag: 'Derivation',
    title: 'Reconciliation',
    body: 'The deterministic step that matches the latest trustworthy closed-bag scan against registered items to derive inventory belief.',
    facts: [
      'Strong evidence requires at least 3 consecutive reads at adequate signal.',
      'Observations older than the 30-minute freshness window go stale.',
      'A bag opened after the scan demotes evidence to stale.',
    ],
  },
  {
    id: 'belief',
    groupId: 'state',
    kind: 'deterministic',
    tag: 'Derived state',
    title: 'Inventory Belief',
    sub: 'Confirmed · Probable · Not detected · Unknown · Stale',
    body: 'Inventory is never a naive boolean. Every item holds an uncertainty-aware state derived from evidence.',
    facts: [
      'Confirmed: strong closed-bag evidence, confidence 0.96.',
      'Probable: weak or inconsistent evidence, confidence 0.25–0.72.',
      'Unknown: invalid or absent evidence, confidence 0.',
    ],
  },
  {
    id: 'readiness',
    groupId: 'decision',
    kind: 'deterministic',
    tag: 'Deterministic',
    title: 'Readiness Engine',
    sub: 'Requirements × inventory belief',
    body: 'Ready only when every approved requirement holds a valid confirmed-present state from the latest successful closed-bag scan.',
    facts: [
      'AI cannot alter readiness.',
      'Failed, stale, or incomplete evidence fails closed — never Ready.',
      'States include missing, uncertain, scan-required, and sensor-unavailable.',
    ],
  },
  {
    id: 'timing',
    groupId: 'decision',
    kind: 'deterministic',
    tag: 'Departure clock',
    title: 'Leave-By Timing',
    body: 'Schedule, travel estimate, and buffer determine the departure threshold. Proximity to that threshold decides when uncertainty becomes urgent.',
    facts: [
      'Canonical demo: leave by 9:35 AM for the 10:00 AM class.',
      'Alerts lead the threshold by 20 minutes.',
      'Snoozes expire at their absolute deadline.',
    ],
  },
  {
    id: 'intervention',
    groupId: 'decision',
    kind: 'deterministic',
    tag: 'Output',
    title: 'Intervention',
    body: 'The visible outcome: an evidence-backed warning before departure when a required item is missing or uncertain.',
    facts: [
      'Lifecycle: create → acknowledge/snooze → reevaluate → reactivate → resolve or expire.',
      'Terminal activities close outstanding alerts.',
      'Browser notifications require an explicit user opt-in.',
    ],
  },
]

export const subsystemById: Record<string, Subsystem> = Object.fromEntries(
  subsystems.map((subsystem) => [subsystem.id, subsystem]),
)

export const DEFAULT_SELECTED_SUBSYSTEM_ID = 'readiness'

export const kindLegend: ReadonlyArray<{ kind: SubsystemKind; label: string }> = [
  { kind: 'model', label: 'Model-assisted' },
  { kind: 'human', label: 'Human-controlled' },
  { kind: 'deterministic', label: 'Deterministic logic' },
  { kind: 'simulated', label: 'Simulated input' },
]
