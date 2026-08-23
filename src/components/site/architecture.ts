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
  sub: string
  body: string
  inputs: readonly string[]
  outputs: readonly string[]
  trust: string
  impl: readonly string[]
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
    sub: 'Algorithms, 10:00 AM, leave by 9:35 AM',
    body: 'The upcoming activity, its schedule, and its destination. Context is the only reason a required item exists.',
    inputs: ['Activity schedule and destination'],
    outputs: ['Activity record', 'Leave-by threshold'],
    trust: 'User-provided schedule; consumed deterministically.',
    impl: ['src/fixtures/activities.ts', 'src/domain/timing.ts'],
  },
  {
    id: 'suggestion',
    groupId: 'requirements',
    kind: 'model',
    tag: 'Model: untrusted',
    title: 'Requirement Suggestion',
    sub: 'Bounded AI layer',
    body: 'A bounded model proposes which registered items the event may require. A deterministic fallback takes over when no model key is configured.',
    inputs: ['Event context', 'Registered items'],
    outputs: ['Carry suggestions (untrusted)'],
    trust: 'Model-assisted. Suggestions never decide inventory presence or readiness.',
    impl: ['src/app/api/carry-profile/route.ts', 'src/adapters/ai/carry-profile-service.ts'],
  },
  {
    id: 'approval',
    groupId: 'requirements',
    kind: 'human',
    tag: 'User gate',
    title: 'User Approval',
    sub: 'Explicit trust boundary',
    body: 'Nothing inferred becomes a requirement until the user accepts it. Rejected suggestions can never reach the checklist.',
    inputs: ['Carry suggestions'],
    outputs: ['Approved item decisions'],
    trust: 'Human-controlled. The model cannot mutate requirements on its own.',
    impl: ['src/application/demo-scenario.ts', 'src/application/trace.ts'],
  },
  {
    id: 'requirements',
    groupId: 'requirements',
    kind: 'deterministic',
    tag: 'Deterministic',
    title: 'Activity Requirements',
    sub: 'Authoritative checklist',
    body: 'The authoritative set of items CarryOS expects the user to have. Readiness is computed against this set and nothing else.',
    inputs: ['Approved item decisions'],
    outputs: ['Required-item set', 'Optional-item set'],
    trust: 'Deterministic. Only user-approved IDs enter.',
    impl: ['src/application/demo-scenario.ts', 'src/domain/types.ts'],
  },
  {
    id: 'registered-items',
    groupId: 'observation',
    kind: 'deterministic',
    tag: 'Registry',
    title: 'Registered Items',
    sub: 'Known items, tag identities',
    body: 'The universe of items CarryOS knows about, each bound to an RFID tag identity. Only registered items participate in observation logic.',
    inputs: ['Item registry'],
    outputs: ['Item + tagId identities'],
    trust: 'Deterministic. Unknown tags cannot influence inventory state.',
    impl: ['src/fixtures/items.ts'],
  },
  {
    id: 'observation',
    groupId: 'observation',
    kind: 'simulated',
    tag: 'Simulated RFID',
    title: 'Observation Layer',
    sub: 'Closed-bag reads',
    body: 'Closed-bag tag reads produce observations. RFID input is simulated in the current implementation; physical reader integration remains future work.',
    inputs: ['Item + tagId identities'],
    outputs: ['Tag observations', 'Scan records'],
    trust: 'Simulated input. No physical reader is validated.',
    impl: ['src/adapters/inventory/simulated-rfid.ts'],
  },
  {
    id: 'evidence',
    groupId: 'observation',
    kind: 'deterministic',
    tag: 'Provenance',
    title: 'Evidence / Provenance',
    sub: 'Scan > observation > state',
    body: 'Each derived state keeps a provenance chain back to the scan identity and the supporting observation IDs that produced it.',
    inputs: ['Tag observations', 'Scan records'],
    outputs: ['Validated evidence set'],
    trust: 'Deterministic. A malformed latest record fails closed.',
    impl: ['src/domain/inventory.ts'],
  },
  {
    id: 'reconciliation',
    groupId: 'state',
    kind: 'deterministic',
    tag: 'Derivation',
    title: 'Reconciliation',
    sub: 'Evidence > belief',
    body: 'Matches the latest trustworthy closed-bag scan against registered items to derive inventory belief.',
    inputs: ['Validated evidence set'],
    outputs: ['Per-item inventory states'],
    trust: 'Deterministic. Bag opened after a scan demotes evidence to stale.',
    impl: ['src/domain/inventory.ts'],
  },
  {
    id: 'belief',
    groupId: 'state',
    kind: 'deterministic',
    tag: 'Derived state',
    title: 'Inventory Belief',
    sub: 'Confirmed / Probable / Not detected / Unknown / Stale',
    body: 'Inventory is never a naive boolean. Every item holds an uncertainty-aware state derived from evidence.',
    inputs: ['Per-item inventory states'],
    outputs: ['Inventory belief per required item'],
    trust: 'Deterministic. Unknown (confidence 0) on invalid evidence.',
    impl: ['src/domain/types.ts', 'src/domain/inventory.ts'],
  },
  {
    id: 'readiness',
    groupId: 'decision',
    kind: 'deterministic',
    tag: 'Deterministic',
    title: 'Readiness Engine',
    sub: 'Requirements x inventory belief',
    body: 'Determines whether every approved requirement has sufficient trustworthy evidence.',
    inputs: ['Activity requirements', 'Inventory belief'],
    outputs: ['Readiness state'],
    trust: 'AI cannot alter this result. Failed, stale, or incomplete evidence fails closed, never Ready.',
    impl: ['src/domain/readiness.ts'],
  },
  {
    id: 'timing',
    groupId: 'decision',
    kind: 'deterministic',
    tag: 'Departure clock',
    title: 'Leave-By Timing',
    sub: 'Schedule + travel + buffer',
    body: 'Schedule, travel estimate, and buffer determine the departure threshold that decides when uncertainty becomes urgent.',
    inputs: ['Event context'],
    outputs: ['Leave-by threshold'],
    trust: 'Deterministic. Snoozes expire at their absolute deadline.',
    impl: ['src/domain/timing.ts'],
  },
  {
    id: 'intervention',
    groupId: 'decision',
    kind: 'deterministic',
    tag: 'Output',
    title: 'Intervention',
    sub: 'Evidence-backed warning',
    body: 'Warns before departure when a required item is missing or uncertain.',
    inputs: ['Readiness state', 'Leave-by threshold'],
    outputs: ['Alert lifecycle', 'Browser notification (opt-in)'],
    trust: 'Deterministic. Terminal activities close outstanding alerts.',
    impl: ['src/domain/alerts.ts', 'src/application/notification-policy.ts'],
  },
]

export const subsystemById: Record<string, Subsystem> = Object.fromEntries(
  subsystems.map((subsystem) => [subsystem.id, subsystem]),
)

export const DEFAULT_SELECTED_SUBSYSTEM_ID = 'readiness'

export const kindLegend: ReadonlyArray<{ kind: SubsystemKind; label: string }> = [
  { kind: 'model', label: 'Model-assisted' },
  { kind: 'human', label: 'Human-controlled' },
  { kind: 'deterministic', label: 'Deterministic' },
  { kind: 'simulated', label: 'Simulated' },
]

export type EdgeClass = 'primary' | 'evidence' | 'state' | 'timing'

export interface EdgeSpec {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  cls: EdgeClass
}

export const edgeSpecs: readonly EdgeSpec[] = [
  { id: 'e-ctx-sug', source: 'event-context', target: 'suggestion', sourceHandle: 'r', targetHandle: 'l', cls: 'primary' },
  { id: 'e-sug-app', source: 'suggestion', target: 'approval', sourceHandle: 'r', targetHandle: 'l', cls: 'primary' },
  { id: 'e-app-req', source: 'approval', target: 'requirements', sourceHandle: 'r', targetHandle: 'l', cls: 'primary' },
  { id: 'e-req-ready', source: 'requirements', target: 'readiness', sourceHandle: 'b', targetHandle: 't', cls: 'primary' },
  { id: 'e-ready-int', source: 'readiness', target: 'intervention', sourceHandle: 'r', targetHandle: 'l', cls: 'primary' },
  { id: 'e-reg-obs', source: 'registered-items', target: 'observation', sourceHandle: 'r', targetHandle: 'l', cls: 'evidence' },
  { id: 'e-obs-ev', source: 'observation', target: 'evidence', sourceHandle: 'r', targetHandle: 'l', cls: 'evidence' },
  { id: 'e-ev-rec', source: 'evidence', target: 'reconciliation', sourceHandle: 'r', targetHandle: 'l', cls: 'evidence' },
  { id: 'e-rec-bel', source: 'reconciliation', target: 'belief', sourceHandle: 'r', targetHandle: 'l', cls: 'state' },
  { id: 'e-bel-ready', source: 'belief', target: 'readiness', sourceHandle: 't', targetHandle: 'b', cls: 'state' },
  { id: 'e-time-int', source: 'timing', target: 'intervention', sourceHandle: 'r', targetHandle: 'b', cls: 'timing' },
  { id: 'e-ctx-time', source: 'event-context', target: 'timing', sourceHandle: 'r2', targetHandle: 'l', cls: 'timing' },
]
