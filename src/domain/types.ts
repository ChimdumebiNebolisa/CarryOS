export const DEMO_NOW = '2026-08-05T09:21:00-05:00'

export type ActivityType = 'class' | 'exam-lab' | 'internship'
export type EventType = ActivityType | 'other'
export type ActivityStatus = 'upcoming' | 'active' | 'completed' | 'cancelled'
export type BagPhysicalState = 'open' | 'closed'
export type SensorStatus = 'connected' | 'disconnected'
export type ScanStatus = 'running' | 'completed' | 'failed'
export type ItemStateStatus =
  | 'confirmed-present'
  | 'probably-present'
  | 'not-detected'
  | 'unknown'
  | 'stale'
export type ReadinessState = 'ready' | 'missing' | 'uncertain' | 'scan-required' | 'sensor-unavailable' | 'not-applicable'
export type AlertType = 'missing-item' | 'uncertain-item'
export type AlertStatus = 'active' | 'acknowledged' | 'suppressed' | 'resolved' | 'expired'
export type LocationHint = 'inside' | 'outside' | 'unknown'
export type EvidenceType = 'explicit' | 'inferred'
export type ProfileSource = 'model' | 'fallback'
export type TraceEventName =
  | 'activity-loaded'
  | 'travel-estimate-loaded'
  | 'travel-estimate-unavailable'
  | 'model-inference-requested'
  | 'model-output-validated'
  | 'fallback-selected'
  | 'suggestion-approved'
  | 'suggestion-rejected'
  | 'bag-opened'
  | 'scan-started'
  | 'scan-completed'
  | 'scan-failed'
  | 'inventory-state-recalculated'
  | 'alert-created'
  | 'alert-updated'
  | 'alert-acknowledged'
  | 'alert-suppressed'
  | 'alert-reactivated'
  | 'alert-resolved'
  | 'alert-expired'
  | 'notification-emitted'
  | 'reader-disconnected'
  | 'reader-reconnected'
  | 'evidence-corruption-detected'
  | 'demo-initialized'
  | 'demo-reset'

export interface Destination {
  name: string
  description?: string
}

export interface Item {
  id: string
  name: string
  category: string
  tagId: string
  tagPlacement: string
}

export interface Activity {
  id: string
  name: string
  type: ActivityType
  startTime: string
  destination: Destination
  travelMinutes?: number
  departureBufferMinutes: number
  requiredItemIds: string[]
  optionalItemIds: string[]
  status: ActivityStatus
}

export interface TravelEstimate {
  durationMinutes: number
  bufferMinutes: number
  leaveBy: string
  provider: 'simulated'
}

export interface TagObservation {
  id: string
  scanId: string
  itemId: string
  tagId: string
  detectedAt: string
  signalStrength?: number
  consecutiveReads: number
  source: 'simulated-rfid'
  bagState: 'closed'
  testLocationHint?: LocationHint
}

export interface Scan {
  id: string
  startedAt: string
  completedAt?: string
  bagState: BagPhysicalState
  status: ScanStatus
  source: 'simulated-rfid'
  readsEvaluated?: number
  error?: string
}

export interface InventoryState {
  itemId: string
  status: ItemStateStatus
  confidence: number
  reasonCode: string
  sourceScanId: string | null
  supportingObservationIds: string[]
  updatedAt: string
}

export interface AlertEvidence {
  activityName: string
  itemName: string
  scanId: string
  latestScanAt: string
  inventoryUpdatedAt: string
  supportingObservationIds: string[]
  inventoryState: ItemStateStatus
  confidence: number
  leaveBy?: string
  nextAction: string
  summary: string
}

export interface Alert {
  id: string
  activityId: string
  itemId: string
  type: AlertType
  status: AlertStatus
  stateVersion: number
  createdAt: string
  updatedAt: string
  snoozedUntil?: string
  resolvedAt?: string
  evidence: AlertEvidence
}

export interface InventoryConfig {
  minimumConsecutiveReads: number
  minimumSignalStrength: number
  observationStaleMinutes: number
  alertLeadMinutes: number
  alertDeduplicationMinutes: number
}

export const DEFAULT_CONFIG: InventoryConfig = {
  minimumConsecutiveReads: 3,
  minimumSignalStrength: -65,
  observationStaleMinutes: 30,
  alertLeadMinutes: 20,
  alertDeduplicationMinutes: 30,
}

export interface Readiness {
  state: ReadinessState
  label: string
  detail: string
  confirmedRequiredCount: number
  requiredCount: number
}

export interface CarryProfileRequest {
  event: {
    name: string
    type: EventType
    description: string
    location?: string
    explicitInstructions?: string
  }
  registeredItems: Array<{
    itemId: string
    name: string
    category: string
  }>
}

export interface CarrySuggestion {
  itemId: string
  confidence: number
  reason: string
  evidenceType: EvidenceType
}

export interface UnregisteredSuggestion {
  name: string
  confidence: number
  reason: string
}

export interface CarryProfileResult {
  source: ProfileSource
  requiredItems: CarrySuggestion[]
  optionalItems: CarrySuggestion[]
  excludedItems: CarrySuggestion[]
  unregisteredSuggestions: UnregisteredSuggestion[]
}

export interface TraceEvent {
  id: string
  name: TraceEventName
  at: string
  detail: string
}

export const ITEM_STATE_LABELS: Record<ItemStateStatus, string> = {
  'confirmed-present': 'Confirmed',
  'probably-present': 'Probable',
  'not-detected': 'Not detected',
  unknown: 'Unknown',
  stale: 'Stale',
}
